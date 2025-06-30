import { Component, Inject, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { OrderManagementService } from '../order-management.service';
import { NZ_MODAL_DATA, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { FormsModule } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { SelectInventoryModalComponent } from '../../inventory-management/select-inventory/select-inventory-modal.component';
import { InventoryManagementService } from '../../inventory-management/inventory-management.service';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, NzFormModule, NzDividerModule, NzTableModule, NzTagModule,
    NzButtonModule, NzSelectModule, NzIconModule, NzInputModule, NzSpinModule, FormsModule
  ],
  templateUrl: './order-form.component.html',
  styleUrl: './order-form.component.scss'
})
export class OrderFormComponent implements OnInit, OnDestroy {
  public loading = false;
  public orderId: string = '';
  public selectedItems: any[] = [];
  public inventoryList: any[] = [];

  public order: any;
  public orderForm!: FormGroup;
  public mode: 'create' | 'edit' | 'view' = 'create';
  public serverValidationErrors: string[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private orderService: OrderManagementService,
    private inventoryService: InventoryManagementService,
    private modalRef: NzModalRef,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private message: NzMessageService,
    private fb: FormBuilder,
    @Inject(NZ_MODAL_DATA) private data: any
  ) { }

  ngOnInit(): void {
    this.orderId = this.data?.id ?? null;
    this.mode = this.data?.mode ?? (this.orderId ? 'edit' : 'create');

    this.buildForm();
    this.loadInventories();

    if (this.mode !== 'create') {
      this.fetchData();
    }
  }

  loadInventories() {
    this.inventoryService.getInventoryByCategory('Materials')
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        if (res.succeeded)
          this.inventoryList = res.data;
      });
  }

  buildForm() {
    this.orderForm = this.fb.group({
      opoNo: [null, [Validators.required, Validators.pattern('^[0-9]+$'), Validators.maxLength(6)]],
      receivedDate: [null, Validators.required],
      requiredDelDate: [null, Validators.required],
      model: [null, Validators.required],
      modelCode: [null, Validators.required],
      modelCategory: [null, Validators.required],
      quantity: [null, [Validators.required, Validators.min(1), Validators.pattern('^[0-9]+$')]],
      unitPrice: [null, [Validators.required, Validators.min(0.0001), Validators.pattern(/^\d+(\.\d{1,4})?$/)]],
      totalPrice: [{ value: 0, disabled: true }],
      unitWages: [null, [Validators.required, Validators.min(0.0001), Validators.pattern(/^\d+(\.\d{1,4})?$/)]],
      other: [null, [Validators.required, Validators.min(0.0001), Validators.pattern(/^\d+(\.\d{1,4})?$/)]],
      hardware: [null, [Validators.required, Validators.min(0.0001), Validators.pattern(/^\d+(\.\d{1,4})?$/)]],
    });

    this.orderForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.validateDeliveryDate(this.orderForm);
    });

    this.orderForm.get('quantity')?.valueChanges.subscribe(() => this.calculateTotalPrice());
    this.orderForm.get('unitPrice')?.valueChanges.subscribe(() => this.calculateTotalPrice());
  }

  fetchData() {
    this.loading = true;
    this.orderService.getOrderById(this.orderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.order = res.data;
          this.orderForm.patchValue({
            opoNo: this.order.id,
            receivedDate: this.order.receivedDate ? this.order.receivedDate.split('T')[0] : null,
            requiredDelDate: this.order.requiredDelDate ? this.order.requiredDelDate.split('T')[0] : null, model: this.order.model,
            modelCode: this.order.modelCode,
            modelCategory: this.order.modelCategory,
            quantity: this.order.quantity,
            unitPrice: this.order.unitPrice,
            totalPrice: this.order.totalPrice,
            unitWages: this.order.unitWages,
            other: this.order.otherCost,
            hardware: this.order.hardwareCost,
          });
          this.selectedItems = res.data.materialsUsed.map((item: any) => ({
            id: item.inventory.id,
            code: item.inventory.code,
            name: item.inventory.name,
            quantity: item.quantity,
            unit: item.inventory.unit,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice
          }));

          this.loading = false;
        },
        error: () => this.loading = false
      });
  }

  convertToLocalDateOnly(isoDate: string): Date | null {
    if (!isoDate) return null;
    const date = new Date(isoDate);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  addItem() {
    const modalRef = this.modal.create({
      nzTitle: 'Select Inventory',
      nzContent: SelectInventoryModalComponent,
      nzFooter: null,
      nzWidth: 600
    });

    modalRef.componentInstance!.inventoryList = this.inventoryList;
    modalRef.componentInstance!.selected = this.selectedItems;
    modalRef.componentInstance!.allowMultiple = true;

    modalRef.afterClose.subscribe((selected: any[] | any) => {
      if (selected) {
        const updated: any[] = [];
        (selected as any[]).forEach(item => {
          const existing = this.selectedItems.find(s => s.id === item.id);
          updated.push({
            ...item,
            quantity: existing ? existing.quantity : null
          });
        });
        this.selectedItems = updated;
      }
    });
  }

  removeItem(id: number) {
    this.selectedItems = this.selectedItems.filter(x => x.id !== id);
  }

  onSave(isDraft: boolean) {
    this.serverValidationErrors = [];
    this.orderForm.markAllAsTouched();

    let hasTableError = false;
    this.selectedItems.forEach(item => {
      this.validateItemQuantity(item);
      if (item.quantityError) hasTableError = true;
    });

    if (this.orderForm.invalid || hasTableError || this.selectedItems.length === 0) {
      this.message.error('Please fill all required fields and fix errors.');
      return;
    }

    const obj: any = {
      Id: this.orderForm.value.opoNo,
      ReceivedDate: this.orderForm.value.receivedDate,
      RequiredDelDate: this.orderForm.value.requiredDelDate,
      Model: this.orderForm.value.model,
      ModelCategory: this.orderForm.value.modelCategory,
      ModelCode: this.orderForm.value.modelCode,
      Quantity: this.orderForm.value.quantity,
      UnitPrice: this.orderForm.value.unitPrice,
      TotalPrice: this.orderForm.getRawValue().totalPrice,
      UnitWages: this.orderForm.value.unitWages,
      OtherCost: this.orderForm.value.other,
      HardwareCost: this.orderForm.value.hardware,
      IsDraft: isDraft,
      MaterialUsed: this.selectedItems.map(x => ({
        InventoryId: x.id,
        Quantity: x.quantity
      }))
    };

    const proceedSave = () => {
      this.loading = true;
      const apiCall = (this.mode === 'edit') ?
        this.orderService.updateOrder(this.data.id, obj) : this.orderService.createOrder(obj);
      apiCall.pipe(takeUntil(this.destroy$)).subscribe({
        next: (res) => {
          this.notification.success('Success', res.message);
          this.modalRef.close(true);
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
      });
    };

    if (!isDraft) {
      this.modal.confirm({
        nzTitle: 'Confirm Submission',
        nzContent: 'Once submitted, you cannot edit this order anymore. Proceed?',
        nzOnOk: () => proceedSave()
      });
    } else {
      proceedSave();
    }
  }

  handlePostSubmit(orderId: string) {
    this.orderService.generateInvoice(orderId).subscribe({
      next: (res) => {
        if (res.succeeded) {
          this.modal.confirm({
            nzTitle: 'Invoice Generated',
            nzContent: 'Invoice generated. Do you want to send it now?',
            nzOnOk: () => this.orderService.sendInvoice(orderId).subscribe(() => {
              this.notification.success('Sent', 'Invoice sent successfully.');
              this.modalRef.close(true);
            }),
            nzOnCancel: () => this.modalRef.close(true)
          });
        } else {
          this.notification.error('Error', 'Failed to generate invoice.');
          this.modalRef.close(true);
        }
      },
      error: () => {
        this.notification.error('Error', 'Invoice generation failed.');
        this.modalRef.close(true);
      }
    });
  }

  onInputUppercase(field: string, event: any) {
    const value = event.target.value.toUpperCase();
    this.orderForm.get(field)?.setValue(value, { emitEvent: false });
  }

  onInputNumeric(field: string, event: any) {
    const value = event.target.value.replace(/\D/g, '');
    this.orderForm.get(field)?.setValue(value, { emitEvent: false });
  }

  calculateTotalPrice(): void {
    const quantityRaw = this.orderForm.get('quantity')?.value;
    const unitPriceRaw = this.orderForm.get('unitPrice')?.value;

    const quantity = Number(quantityRaw);
    const unitPrice = Number(unitPriceRaw);

    if (!isNaN(quantity) && !isNaN(unitPrice) && quantity > 0 && unitPrice > 0) {
      const total = this.toFixedDecimal(quantity * unitPrice, 4);
      this.orderForm.patchValue({ totalPrice: total }, { emitEvent: false });
    } else {
      this.orderForm.patchValue({ totalPrice: null }, { emitEvent: false });
    }
  }

  toFixedDecimal(value: number, decimals: number): number {
    return Number(value.toFixed(decimals));
  }

  isValidNumber(value: any): boolean {
    return typeof value === 'number' && !isNaN(value);
  }

  isInteger(value: any): boolean {
    return Number.isInteger(value);
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr || dateStr.startsWith('0001-01-01')) {
      return '-';
    }
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Draft': return 'status-draft';
      case 'Pending': return 'status-pending';
      case 'Created': return 'status-created';
      case 'In Progress': return 'status-inProgress';
      case 'Completed': return 'status-completed';
      case 'Invoiced': return 'status-invoiced';
      case 'Delivered': return 'status-delivered';
      default: return '';
    }
  }

  hasFieldError(fieldName: string, errorType?: string): boolean {
    const control = this.orderForm.get(fieldName);
    if (!control) return false;

    if (errorType) {
      return control.hasError(errorType);
    }
    return control.invalid;
  }

  validateItemQuantity(item: any) {
    if (item.quantity == null || item.quantity < 1) {
      item.quantityError = 'Quantity is required and must be at least 1.';
    } else if (!Number.isInteger(item.quantity)) {
      item.quantityError = 'Quantity must be an integer.';
    } else {
      item.quantityError = null;
    }
  }

  formatOPONo(id: number): string {
    return 'OPO' + id.toString().padStart(6, '0');
  }

  validateDeliveryDate(group: FormGroup) {
    const receivedDate = group.get('receivedDate')?.value;
    const requiredDelDate = group.get('requiredDelDate')?.value;

    if (receivedDate && requiredDelDate) {
      const received = new Date(receivedDate);
      const required = new Date(requiredDelDate);

      if (required <= received) {
        group.get('requiredDelDate')?.setErrors({ deliveryBeforeReceived: true });
      } else {
        // Clear the custom error if the condition passes
        const errors = group.get('requiredDelDate')?.errors;
        if (errors) {
          delete errors['deliveryBeforeReceived'];
          if (Object.keys(errors).length === 0) {
            group.get('requiredDelDate')?.setErrors(null);
          } else {
            group.get('requiredDelDate')?.setErrors(errors);
          }
        }
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
