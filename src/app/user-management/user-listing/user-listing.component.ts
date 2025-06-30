import { Component, OnDestroy, OnInit } from '@angular/core';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { CommonModule } from '@angular/common';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { UserManagementService } from '../user-management.service'
import { NzMessageService } from 'ng-zorro-antd/message';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { UserFormComponent } from '../user-form/user-form.component';
import { AuthService } from '../../core/auth/auth.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Component({
  selector: 'app-user-listing',
  standalone: true,
  imports: [
    NzTableModule, NzIconModule, NzGridModule, NzSpaceModule,
    NzSpinModule, NzInputModule, NzButtonModule, NzModalModule,
    NzSelectModule, CommonModule, ReactiveFormsModule
  ],
  templateUrl: './user-listing.component.html',
  styleUrl: './user-listing.component.scss'
})
export class UserListingComponent implements OnInit, OnDestroy {
  public columns: any = [];
  public userList: any = [];
  public loading = false;
  public hasAccess: any;

  public pageSize = 10;
  public pageNumber = 1;
  public totalCount = 0;
  public searchControl = new FormControl('');
  public roleControl = new FormControl('');

  public roleList = [
    { value: 'Admin', label: 'Administrator' },
    { value: 'Order', label: 'Order Management Staff' },
    { value: 'Inventory', label: 'Inventory Management Staff' }
  ];

  private destroy$ = new Subject<void>();

  constructor(private authService: AuthService, private userService: UserManagementService, private message: NzMessageService, private modal: NzModalService, private notification: NzNotificationService) { }

  ngOnInit(): void {
    this.columns = this.getColumns();
    this.loadUsers();
    this.searchControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageNumber = 1; // Reset to first page when searching
        this.loadUsers();
      });

    this.roleControl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageNumber = 1;
        this.loadUsers();
      });
  }

  getColumns() {
    return [
      { field: 'empNumber', header: 'Employee No' },
      { field: 'fullName', header: 'Full Name' },
      { field: 'userName', header: 'Username' },
      { field: 'email', header: 'Email' },
      { field: 'phoneNumber', header: 'Phone Number' },
      { field: 'roleDisplay', header: 'Role' }
    ]
  }

  loadUsers() {
    this.loading = true;
    const obj = {
      PageNumber: this.pageNumber,
      PageSize: this.pageSize,
      Search: this.searchControl.value?.trim() || '',
      Role: this.roleControl.value || ''
    };
    this.userService.getAllUsers(obj)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.succeeded && response.data) {
            this.userList = response.data.map((user) => ({
              ...user,
              fullName: `${user.firstName} ${user.lastName}`,
              roleDisplay: this.formatRoles(user.roles)
            }));
            this.totalCount = response.totalCount;
          }
          this.loading = false;
        },
        error: () => {
          this.notification.error('Error', 'Failed to load users');
          this.loading = false;
        }
      });
  }

  formatRoles(roles: string[]) {
    const roleMap: { [key: string]: string } = {
      'Admin': 'Administrator',
      'Order': 'Order Management',
      'Inventory': 'Inventory Management'
    }

    return roles
      .map(role => roleMap[role] || role)
      .join(', ');
  }

  onPageChange(pageNumber: number) {
    this.pageNumber = pageNumber;
    this.loadUsers();
  }

  resetSearch() {
    this.searchControl.reset();
    this.pageNumber = 1;
    this.loadUsers();
  }

  createUser() {
    const modalRef = this.modal.create({
      nzTitle: 'Create New User',
      nzContent: UserFormComponent,
      nzData: { id: null },
      nzFooter: null,
      nzWidth: 800, // Set appropriate width
      nzStyle: { top: '120px' }, // Position from top
      nzBodyStyle: {
        'max-height': 'calc(100vh - 200px)', // Dynamic height calculation
        'overflow-y': 'auto', // Enable vertical scrolling
        'padding': '20px 24px'
      },
      nzMaskClosable: false
    });

    modalRef.afterClose.subscribe((resp) => {
      if (resp === true) {
        this.loadUsers();
      }
      else if (resp && resp.reactivateUserId) {
        this.promptReactivation(resp.reactivateUserId, resp.reactivateMessage);
      }
    });
  }

  promptReactivation(userId: string, message: string) {
    this.modal.confirm({
      nzTitle: 'Reactivate User?',
      nzContent: message,
      nzOkText: 'Yes, Reactivate',
      nzOnOk: () => {
        this.openReactivationForm(userId);
      },
      nzCancelText: 'Cancel',
    });

  }
  
  openReactivationForm(userId: string) {
    const modalRef = this.modal.create({
      nzTitle: 'Reactivate User',
      nzContent: UserFormComponent,
      nzData: { id: userId, reactivateMode: true },
      nzFooter: null,
      nzWidth: 800,
      nzStyle: { top: '120px' },
      nzBodyStyle: {
        'max-height': 'calc(100vh - 200px)',
        'overflow-y': 'auto',
        'padding': '20px 24px'
      },
      nzMaskClosable: false
    });

    modalRef.afterClose.subscribe((resp) => {
      if (resp === true) {
        this.loadUsers();
      }
    });
  }

  editUser(data: any) {
    const modalRef = this.modal.create({
      nzTitle: 'Edit User',
      nzContent: UserFormComponent,
      nzData: { id: data.id },
      nzFooter: null,
      nzWidth: 800,
      nzStyle: { top: '120px' },
      nzBodyStyle: {
        'max-height': 'calc(100vh - 200px)',
        'overflow-y': 'auto',
        'padding': '20px 24px'
      },
      nzMaskClosable: false
    });

    modalRef.afterClose.subscribe((resp) => {
      if (resp === true) {
        this.loadUsers();
      }
    });
  }

  confirmDelete(data: any) {
    this.modal.confirm({
      nzTitle: 'Are you sure delete this user?',
      nzOkText: 'Yes',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.deleteUser(data),
      nzCancelText: 'No',
      nzOnCancel: () => { },
    })
  }

  deleteUser(data: any) {
    this.loading = true;
    this.userService.deleteUser(data.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.succeeded) {
            this.notification.success('Success', response.message);
            this.loading = false;
            this.loadUsers();
          }
        },
        error: (error) => {
          this.notification.error('Error',`${error.error.message}`);
          this.loading = false;
        }
      })
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
