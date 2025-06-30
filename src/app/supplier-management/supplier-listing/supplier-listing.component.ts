import { Component, OnDestroy, OnInit } from '@angular/core';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { CommonModule } from '@angular/common';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { SupplierManagementService } from '../supplier-management.service'
import { NzMessageService } from 'ng-zorro-antd/message';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SupplierFormComponent } from '../supplier-form/supplier-form.component';
import { AuthService } from '../../core/auth/auth.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Component({
  selector: 'app-supplier-listing',
  standalone: true,
  imports: [
    NzTableModule, NzIconModule, NzGridModule, NzSpaceModule,
    NzSpinModule, NzInputModule, NzButtonModule, NzModalModule,
    CommonModule, ReactiveFormsModule
  ],
  templateUrl: './supplier-listing.component.html',
  styleUrl: './supplier-listing.component.scss'
})
export class SupplierListingComponent implements OnInit, OnDestroy {
  public columns: any = [];
  public supplierList: any = [];
  public loading = false;
  public hasAccess: any;

  public pageSize = 10;
  public pageNumber = 1;
  public totalCount = 0;
  public searchControl = new FormControl('');

  private destroy$ = new Subject<void>();
  private currentUser: any;

  constructor(private supplierService: SupplierManagementService, private message: NzMessageService, private modal: NzModalService, private authService: AuthService,
    private notification: NzNotificationService
  ) {
    this.currentUser = this.authService.currentUserValue;
   }

  ngOnInit(): void {
    this.hasAccess = this.currentUser.roles.includes('Admin') || this.currentUser.roles.includes('Inventory');
    this.columns = this.getColumns();
    this.loadSuppliers();
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.pageNumber = 1; // Reset to first page when searching
        this.loadSuppliers();
      });
  }

  getColumns() {
    return [
      { field: 'name', header: 'Name' },
      { field: 'email', header: 'Email' },
      { field: 'phoneNumber', header: 'Contact No' },
      { field: 'contactPerson', header: 'Contact Person' }
    ]
  }

  loadSuppliers() {
    this.loading = true;
    const obj = {
      PageNumber: this.pageNumber,
      PageSize: this.pageSize,
      Search: this.searchControl.value?.trim() || ''
    };
    this.supplierService.getAllSuppliers(obj)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.succeeded && response.data) {
            this.supplierList = response.data;
            this.totalCount = response.totalCount;
          }
          this.loading = false;
        },
        error: () => {
          this.notification.error('Error','Failed to load suppliers');
          this.loading = false;
        }
      });
  }

  onPageChange(pageNumber: number) {
    this.pageNumber = pageNumber;
    this.loadSuppliers();
  }

  resetSearch() {
    this.searchControl.reset();
    this.pageNumber = 1;
    this.loadSuppliers();
  }

  createSupplier() {
    const modalRef = this.modal.create({
      nzTitle: 'Create New Supplier',
      nzContent: SupplierFormComponent,
      nzData: { id: null },
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
        this.loadSuppliers();
      }
    });
  }

  editSupplier(data: any) {
    const modalRef = this.modal.create({
      nzTitle: 'Edit User',
      nzContent: SupplierFormComponent,
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
        this.loadSuppliers();
      }
    });
  }

  confirmDelete(data: any) {
    this.modal.confirm({
      nzTitle: 'Are you sure delete this supplier?',
      nzContent: '<b>This action will permanently delete the supplier.</b>',
      nzOkText: 'Yes',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.deleteSupplier(data),
      nzCancelText: 'No',
      nzOnCancel: () => { },
    })
  }

  deleteSupplier(data: any) {
    this.loading = true;
    this.supplierService.deleteSupplier(data.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.succeeded) {
            this.notification.success('Success', response.message);
            this.loading = false;
            this.loadSuppliers();
          }
        },
        error: (error) => {
          this.notification.error('Error',`${error.error.Message}`);
          this.loading = false;
        }
      })
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
