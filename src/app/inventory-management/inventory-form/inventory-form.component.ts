import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { FormBuilder, FormGroup, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { InventoryManagementService } from '../inventory-management.service';
import { SupplierManagementService } from '../../supplier-management/supplier-management.service';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Component({
  selector: 'app-inventory-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NzFormModule, NzDividerModule,
    NzButtonModule, NzSelectModule, NzIconModule, NzInputModule, NzSpinModule],
  templateUrl: './inventory-form.component.html',
  styleUrl: './inventory-form.component.scss'
})
export class InventoryFormComponent implements OnInit, OnDestroy {
  public loading = false;
  public isEdit = false;
  public inventoryForm!: FormGroup;
  public inventory: any;
  public supplierList: any[] = [];

  public isReactivation = false;
  public reactivateId: string | null = null;
  public serverValidationErrors: string[] = [];

  public catList: any = [
    { value: 'Materials', label: 'Materials' },
    { value: 'Consumables', label: 'Consumables' },
    { value: 'Hardware', label: 'Hardware' },
  ]

  private inventoryId: string = '';
  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder, private inventoryService: InventoryManagementService,
    private modalRef: NzModalRef, @Inject(NZ_MODAL_DATA) private data: any,
    private notification: NzNotificationService, private message: NzMessageService, private supplierService: SupplierManagementService) { }

   ngOnInit() {
    this.inventoryId = this.data?.id ?? null;
    this.isEdit = !!this.inventoryId;
    this.isReactivation = !!this.data?.reactivateMode;

    this.loadSuppliers();
    this.buildForm();

    if (this.inventoryId) {
      setTimeout(()=>this.fetchData());
    }

    this.setupValueChangeListeners();
  }

  setupValueChangeListeners() {
    this.inventoryForm.get('quantity')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.inventoryForm.updateValueAndValidity({ onlySelf: false }));

    this.inventoryForm.get('minQty')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.inventoryForm.updateValueAndValidity({ onlySelf: false }));

    this.inventoryForm.get('category')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.supplier?.markAsTouched();
        this.inventoryForm.updateValueAndValidity({ onlySelf: false });
      });

    this.inventoryForm.get('supplier')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.inventoryForm.updateValueAndValidity({ onlySelf: false }));
  }


  buildForm() {
    this.inventoryForm = this.fb.group({
      code: [{ value: '', disabled: this.isEdit || this.isReactivation }, Validators.required],
      name: ['', Validators.required],
      category: ['', Validators.required],
      supplier: [null],
      quantity: [{ value: 1, disabled: this.isEdit && !this.isReactivation }, [Validators.required, Validators.pattern(/^[1-9]\d*$/)]],
      unit: ['', [Validators.required, Validators.pattern(/^[A-Za-z]+$/)]],
      unitPrice: [{ value: 1, disabled: this.isEdit && !this.isReactivation }, [Validators.required, Validators.pattern(/^\d+(\.\d{1,4})?$/)]],
      minQty: [null, [Validators.required, Validators.pattern(/^\d+$/)]],
    }, {
      validators: [this.minQtyNotMoreThanQuantity, this.supplierRequiredForMaterials]
    });
  }

  loadSuppliers() {
    const obj = {
      PageNumber: 1,
      PageSize: 100,
      Search: ''
    };

    this.supplierService.getAllSuppliers(obj)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.succeeded && res.data) {
            this.supplierList = res.data;
          }
        }
      });
  }

  fetchData() {
    this.loading = true;
    this.inventoryService.getInventoryById(this.inventoryId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.succeeded && res.data) {
            this.inventory = res.data;
            this.inventoryForm.patchValue({
              code: this.inventory.code,
              name: this.inventory.name,
              category: this.catList.find(c => c.value === this.inventory.category)?.value,
              supplier: this.inventory.supplierName? 
                        this.supplierList.find(s => s.name.toLowerCase() === this.inventory.supplierName.toLowerCase())?.id
                        : null,
              quantity: this.inventory.totalQty,
              unit: this.inventory.unit,
              unitPrice: this.inventory.lastUnitPrice,
              minQty: this.inventory.minQty,
            });
          }
          this.loading = false;
        },
        error: (error) => {
          this.notification.error('Error', error.message);
          this.loading = false;
        }
      });
  }

  validateAllFormFields(): void {
    Object.keys(this.inventoryForm.controls).forEach(key => {
      const control = this.inventoryForm.get(key);
      if (control && control.invalid) {
        control.markAsDirty();
        control.updateValueAndValidity({ onlySelf: true });
      }
    });
  }


  minQtyNotMoreThanQuantity(control: AbstractControl) {
    const minQtyControl = control.get('minQty');
    const quantityControl = control.get('quantity');

    if (minQtyControl && quantityControl) {
      const minQty = minQtyControl.value;
      const quantity = quantityControl.value;

      if (minQty != null && quantity != null && Number(minQty) > Number(quantity)) {
        minQtyControl.setErrors({ minQtyExceed: true });
      } else {
        // Clear previous error if condition no longer true
        if (minQtyControl.hasError('minQtyExceed')) {
          const currentErrors = { ...minQtyControl.errors };
          delete currentErrors['minQtyExceed'];
          if (Object.keys(currentErrors).length === 0) {
            minQtyControl.setErrors(null);
          } else {
            minQtyControl.setErrors(currentErrors);
          }
        }
      }
    }

    return null; 
  }

  supplierRequiredForMaterials(control: AbstractControl) {
    const category = control.get('category')?.value;
    const supplierControl = control.get('supplier');

    if (category?.toLowerCase() === 'materials' && supplierControl && !supplierControl.value) {
      supplierControl.setErrors({ supplierRequired: true });
    } else {
      // Clear previous error if any
      if (supplierControl?.hasError('supplierRequired')) {
        const currentErrors = { ...supplierControl.errors };
        delete currentErrors['supplierRequired'];
        if (Object.keys(currentErrors).length === 0) {
          supplierControl.setErrors(null);
        } else {
          supplierControl.setErrors(currentErrors);
        }
      }
    }

    return null;
  }

  expiredDateNotPast(control: AbstractControl) {
    const date = control.get('expiredDate')?.value;
    if (date) {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        return { expiredDatePast: true };
      }
    }
    return null;
  }

  onSave() {
    if (this.inventoryForm.invalid || this.loading) {
      this.validateAllFormFields();
      return;
    }

    this.loading = true;
    this.serverValidationErrors = [];

    if (this.inventoryForm.valid) {
      const obj: any = {
        Id: this.inventoryId,
        Code: this.code?.value,
        Name: this.name?.value,
        Category: this.category?.value,
        Unit: this.unit?.value,
        TotalQty: Number(this.quantity?.value),
        MinQty: Number(this.minQty?.value),
        UnitPrice: Number(this.unitPrice?.value),
        SupplierId: this.supplier ? this.supplier?.value : null
      }

      const request = this.inventoryId
        ? this.inventoryService.updateInventory(this.inventoryId, obj)
        : this.inventoryService.createInventory(obj);

      request.pipe(takeUntil(this.destroy$)).subscribe({
        next: (res) => {
          if (res.succeeded) {
            this.notification.success('Success', res.message);
            this.modalRef.close(true);
            this.loading = false;
          }
          else if (!res.succeeded && res.exceptionType === "ReactivateException") {
            this.modalRef.close({ reactivateId: res.id2, reactivateMessage: res.message });
            this.loading = false;
          }
        },
        error: (err) => {
          this.loading = false;
          if (err.error && err.error.Errors && Array.isArray(err.error.Errors)) {
            this.serverValidationErrors = err.error.Errors;
          }
          else {
            this.notification.error('Error', err.message);
          }
        }
      })
    };
  }

  onReactivate() {
    if (this.inventoryForm.invalid || this.loading) {
      this.validateAllFormFields();
      return;
    }

    this.loading = true;
    this.serverValidationErrors = [];

    if (this.inventoryForm.valid) {
      const obj: any = {
        Name: this.name?.value,
        Category: this.category?.value,
        Unit: this.unit?.value,
        TotalQty: Number(this.quantity?.value),
        MinQty: Number(this.minQty?.value),
        UnitPrice: Number(this.unitPrice?.value),
        SupplierId: this.supplier ? this.supplier?.value : null
      }

      this.inventoryService.reactivateInventory(this.inventoryId, obj)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            this.notification.success('Success', res.message);
            this.modalRef.close(true);
            this.loading = false;
          },
          error: (err) => {
            this.loading = false;
            if (err.error && err.error.errors && Array.isArray(err.error.Errors)) {
              this.serverValidationErrors = err.error.errors;
            }
            else {
              this.notification.error('Error', err.message);
            }
          }
        })
    };
  }

  onInputUppercase(controlName: string, event: any) {
    const input = event.target as HTMLInputElement;
    const uppercased = input.value.toUpperCase();
    input.value = uppercased;
    this.inventoryForm.get(controlName)?.setValue(uppercased, { emitEvent: false });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get code() { return this.inventoryForm.get('code'); }
  get name() { return this.inventoryForm.get('name'); }
  get category() { return this.inventoryForm.get('category'); }
  get supplier() { return this.inventoryForm.get('supplier'); }
  get quantity() { return this.inventoryForm.get('quantity'); }
  get unit() { return this.inventoryForm.get('unit'); }
  get unitPrice() { return this.inventoryForm.get('unitPrice'); }
  get minQty() { return this.inventoryForm.get('minQty'); }
}
