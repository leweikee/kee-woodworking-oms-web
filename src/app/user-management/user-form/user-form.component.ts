import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { FormBuilder, FormGroup, AbstractControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { PasswordStrengthValidator } from '../../shared/validators/password-strength.validator';
import { Subject, take, takeUntil } from 'rxjs';
import { UserManagementService } from '../user-management.service';
import { NZ_MODAL_DATA, NzModalModule, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NzFormModule, NzDividerModule,
    NzButtonModule, NzSelectModule, NzIconModule, NzInputModule, NzSpinModule,
    NzModalModule],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss'
})
export class UserFormComponent implements OnInit, OnDestroy {
  public loading = false;
  public isEdit = false;
  public userForm!: FormGroup;
  public user: any;
  public roleList = ['Administrator', 'Order Management Staff', 'Inventory Management Staff'];

  public serverValidationErrors: string[] = [];
  public reactivateUserId: string | null = null;
  public isReactivation = false;

  private userId: string = '';
  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder, private userService: UserManagementService, private modal: NzModalService,
    private modalRef: NzModalRef, @Inject(NZ_MODAL_DATA) private data: any,
    private message: NzMessageService, private notification: NzNotificationService
  ) { }

  ngOnInit() {
    this.userId = this.data?.id ?? null;
    this.isEdit = !!this.userId;
    this.isReactivation = !!this.data?.reactivateMode;

    this.buildForm();

    if (this.userId) {
      this.fetchData();
    }
  }

  buildForm() {
    this.userForm = this.fb.group({
      firstName: [{ value: '', disabled: this.isReactivation }, [Validators.required]],
      lastName: [{ value: '', disabled: this.isReactivation }, [Validators.required]],
      userName: [{ value: '', disabled: this.isReactivation }, [Validators.required, Validators.minLength(6)]],
      empNumber: [{ value: '', disabled: this.isReactivation }, [Validators.required, Validators.minLength(6)]],
      email: [{ value: '', disabled: this.isReactivation }, [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(11)]],
      role: [null, Validators.required]
    });

    if (!this.isEdit || this.isReactivation) {
      this.userForm.addControl('password', this.fb.control('', [
        Validators.required,
        Validators.minLength(8),
        PasswordStrengthValidator()
      ]));
    }
  }

  getPasswordValidators() {
    return [
      Validators.required,
      Validators.minLength(8),
      PasswordStrengthValidator
    ];
  }

  fetchData() {
    this.loading = true;
    this.userService.getUserById(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.succeeded && response.data) {
            this.user = response.data;
            this.userForm.patchValue({
              firstName: this.user.firstName,
              lastName: this.user.lastName,
              userName: this.user.userName,
              empNumber: this.user.empNumber,
              email: this.user.email,
              phoneNumber: this.user.phoneNumber,
              role: this.mapRoleBack(this.user.roles[0])
            });
          }
          this.loading = false;
        },
        error: (error) => {
          this.notification.error('Error', error.message);
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

  mapRoleToDb(role: string): string {
    switch (role) {
      case 'Administrator':
        return 'Admin';
      case 'Order Management Staff':
        return 'Order';
      case 'Inventory Management Staff':
        return 'Inventory';
      default:
        return role;
    }
  }

  validateAllFormFields(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      if (control && control.invalid) {
        control.markAsDirty();
        control.updateValueAndValidity({ onlySelf: true });
      }
    });
  }

  onSave() {
    if (this.userForm.invalid || this.loading) {
      this.validateAllFormFields();
      return;
    }

    this.loading = true;
    this.serverValidationErrors = [];

    if (this.userForm.valid) {
      const obj: any = {
        FirstName: this.firstName?.value,
        LastName: this.lastName?.value,
        UserName: this.userName?.value,
        EmpNumber: this.empNumber?.value,
        Email: this.email?.value,
        PhoneNumber: this.phoneNumber?.value,
        Roles: [this.mapRoleToDb(this.role?.value)]
      };

      if (!this.isEdit && this.password?.value) {
        obj.Password = this.password?.value; // Include password only if it's not in edit mode
        obj.ConfirmPassword = this.password?.value;
      }

      const request = this.userId
        ? this.userService.updateUser(this.userId, obj)
        : this.userService.createUser(obj);

      request
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.succeeded) {
              this.notification.success('Success', response.message);
              this.modalRef.close(true);
              this.loading = false;
            }
            else if (!response.succeeded && response.exceptionType === "ReactivateException") {
              this.modalRef.close({ reactivateUserId: response.id, reactivateMessage: response.message });
              this.loading = false;
            }
          },
          error: (error) => {
            this.loading = false;
            if (error.error && error.error.Errors && Array.isArray(error.error.Errors)) {
              this.serverValidationErrors = error.error.Errors;
            }
            else {
              this.notification.error('Error', error.message);
            }
          }
        });
    };
  }

  onReactivate() {
    if (this.userForm.invalid || this.loading) {
      this.validateAllFormFields();
      return;
    }

    this.loading = true;
    this.serverValidationErrors = [];

    if (this.userForm.valid) {
      const obj: any = {
        PhoneNumber: this.phoneNumber?.value,
        TempPassword: this.password?.value,
        Roles: [this.mapRoleToDb(this.role?.value)]
      };

      this.userService.reactivateUser(this.userId, obj)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.notification.success('Success', response.message);
            this.modalRef.close(true);
            this.loading = false;
          },
          error: (error) => {
            this.loading = false;
            if (error.error && error.error.Errors && Array.isArray(error.error.Errors)) {
              this.serverValidationErrors = error.error.Errors;
            } else {
              this.notification.error('Error', error.message);
            }
          }
        });
    };
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get firstName() { return this.userForm.get('firstName') };
  get lastName() { return this.userForm.get('lastName') };
  get userName() { return this.userForm.get('userName') };
  get password() { return this.userForm.get('password') };
  get empNumber() { return this.userForm.get('empNumber') };
  get email() { return this.userForm.get('email') };
  get phoneNumber() { return this.userForm.get('phoneNumber') };
  get role() { return this.userForm.get('role') };
}
