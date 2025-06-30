import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { SupplierManagementService } from '../supplier-management.service';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NzFormModule, NzDividerModule,
    NzButtonModule, NzSelectModule, NzIconModule, NzInputModule, NzSpinModule],
  templateUrl: './supplier-form.component.html',
  styleUrl: './supplier-form.component.scss'
})
export class SupplierFormComponent implements OnInit, OnDestroy {
  public loading = false;
  public isEdit = false;
  public supplierForm!: FormGroup;
  public supplier: any;
  public serverValidationErrors: string[] = [];

  private supplierId: string = '';
  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder, private supplierService: SupplierManagementService,
    private modalRef: NzModalRef, @Inject(NZ_MODAL_DATA) private data: any,
    private message: NzMessageService, private notification: NzNotificationService
  ) { }

  ngOnInit() {
    this.supplierId = this.data?.id ?? null;
    this.isEdit = !!this.supplierId;
    this.buildForm();

    if (this.supplierId) {
      this.fetchData();
    }
  }

  toUppercase(event: any) {
    const input = event.target as HTMLInputElement;

    // Get the current value, convert it to uppercase
    const uppercasedValue = input.value.toUpperCase();

    // Set the input's value to uppercase
    input.value = uppercasedValue;

    // Update the form control value with uppercase
    this.supplierForm.get('name')?.setValue(uppercasedValue, { emitEvent: false });

    // Restore cursor position (if necessary)
    const start = input.selectionStart;
    const end = input.selectionEnd;
    input.setSelectionRange(start, end);
  }

  buildForm() {
    this.supplierForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(11)]],
      contactPerson: ['', [Validators.required]],
    });
  }

  fetchData() {
    this.loading = true;
    this.supplierService.getSupplierById(this.supplierId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.succeeded && response.data) {
            this.supplier = response.data;
            this.supplierForm.patchValue({
              name: this.supplier.name,
              email: this.supplier.email,
              phoneNumber: this.supplier.phoneNumber,
              contactPerson: this.supplier.contactPerson,
            });
          }
          this.loading = false;
        },
        error: () => {
          this.notification.error('Error', 'Failed to load supplier');
          this.loading = false;
        }
      })
  }

  validateAllFormFields(): void {
    Object.keys(this.supplier.controls).forEach(key => {
      const control = this.supplierForm.get(key);
      if (control && control.invalid) {
        control.markAsDirty();
        control.updateValueAndValidity({ onlySelf: true });
      }
    });
  }

  onSave() {
    if (this.supplierForm.invalid || this.loading) {
      this.validateAllFormFields();
      return;
    }

    this.loading = true;
    if (this.supplierForm.valid) {
      const obj: any = {
        Id: this.supplierId ? this.supplierId : null,
        Name: this.name?.value,
        Email: this.email?.value,
        PhoneNumber: this.phoneNumber?.value,
        ContactPerson: this.contactPerson?.value,
      };

      const request = this.supplierId
        ? this.supplierService.updateSupplier(this.supplierId, obj)
        : this.supplierService.createSupplier(obj);

      request
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.succeeded && response.data) {
              this.notification.success('Success', response.message);
              this.modalRef.close(true);
              this.loading = false
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

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get name() { return this.supplierForm.get('name') };
  get email() { return this.supplierForm.get('email') };
  get phoneNumber() { return this.supplierForm.get('phoneNumber') };
  get contactPerson() { return this.supplierForm.get('contactPerson') };
}
