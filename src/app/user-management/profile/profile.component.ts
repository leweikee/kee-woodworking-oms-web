import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { UserManagementService } from '../user-management.service';
import { AuthService } from '../../core/auth/auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NzFormModule, NzDividerModule,
    NzButtonModule, NzSelectModule, NzAvatarModule, NzIconModule, NzInputModule, NzSpinModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit, OnDestroy {
  public loading = false;
  public isReadonly: boolean = true;
  public profileForm!: FormGroup;
  public user: any;
  public userId: any;
  public fullName: any;
  public role: any;

  private destroy$ = new Subject<void>();
  private currentUser: any;

  constructor(private fb: FormBuilder, private userService: UserManagementService, private authService: AuthService,
    private message: NzMessageService
  ) { this.currentUser = this.authService.currentUserValue; }

  ngOnInit() {
    this.userId = this.currentUser.id;
    this.buildForm();

    if (this.userId) {
      this.fetchData();
    }
  }

  buildForm() {
    this.profileForm = this.fb.group({
      firstName: [{ value: '', disabled: true }],
      lastName: [{ value: '', disabled: true }],
      empNumber: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],
      phoneNumber: [{ value: '', disabled: true }]
    });
  }

  fetchData() {
    this.loading = true;
    this.userService.getUserById(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.succeeded && response.data) {
            this.user = response.data;
            this.profileForm.patchValue({
              firstName: this.user.firstName,
              lastName: this.user.lastName,
              empNumber: this.user.empNumber,
              email: this.user.email,
              phoneNumber: this.user.phoneNumber
            });
            this.fullName = `${this.user.firstName} ${this.user.lastName}`;
            this.role = this.user.roles?.length ? this.mapRoleBack(this.user.roles[0]) : '';
          }
          this.loading = false;
        },
        error: () => {
          this.message.error('Failed to load profile');
          this.loading = false;
        }
      })
  }

  mapRoleBack(role: string): string {
    switch (role) {
      case 'Admin':
        return 'Administrator';
      case 'Order':
        return 'Order Management Staff';
      case 'Inventory':
        return 'Inventory Management Staff';
      default:
        return role;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
