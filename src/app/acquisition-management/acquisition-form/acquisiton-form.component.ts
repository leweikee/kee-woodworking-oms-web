import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
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
import { InventoryManagementService } from '../../inventory-management/inventory-management.service';
import { AcquisitionManagementService } from '../acquisition-management.service';
import { SupplierManagementService } from '../../supplier-management/supplier-management.service';
import { NZ_MODAL_DATA, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { FormsModule } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { SelectInventoryModalComponent } from '../../inventory-management/select-inventory/select-inventory-modal.component';

@Component({
  selector: 'app-acquisition-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, NzFormModule, NzDividerModule, NzTableModule, NzTagModule,
    NzButtonModule, NzSelectModule, NzIconModule, NzInputModule, NzSpinModule, FormsModule
  ],
  templateUrl: './acquisition-form.component.html',
  styleUrl: './acquisition-form.component.scss'
})
export class AcquisitionFormComponent implements OnInit, OnDestroy {
  public loading = false;
  public acquisitionId: string = '';
  public selectedItems: any[] = [];
  public inventoryList: any[] = [];
  public supplierList: any[] = [];
  public acquisition: any;
  public acquisitionForm!: FormGroup;
  public mode: 'create' | 'edit' | 'view' = 'create';
  private destroy$ = new Subject<void>();

  constructor(
    private inventoryService: InventoryManagementService,
    private acquisitionService: AcquisitionManagementService,
    private supplierService: SupplierManagementService,
    private modalRef: NzModalRef,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private message: NzMessageService,
    private fb: FormBuilder,
    @Inject(NZ_MODAL_DATA) private data: any
  ) { }

  ngOnInit(): void {
    this.acquisitionId = this.data?.id ?? null;
    this.mode = this.data?.mode ?? (this.acquisitionId ? 'edit' : 'create');
    this.loadSuppliers();
    this.buildForm();

    if (this.mode !== 'create') {
      this.fetchData();
    }
  }

  buildForm() {
    this.acquisitionForm = this.fb.group({
      supplierId: [null, Validators.required]
    });
  }

  loadSuppliers() {
    const obj = { PageNumber: 1, PageSize: 100, Search: '' };
    this.supplierService.getAllSuppliers(obj)
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        if (res.succeeded) this.supplierList = res.data;
      });
  }

  fetchData() {
    this.loading = true;
    this.acquisitionService.getAcquisitionById(this.acquisitionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.acquisition = res.data;
          this.acquisitionForm.patchValue({ supplierId: this.supplierList.find(s => s.name.toLowerCase() === this.acquisition.supplierName.toLowerCase())?.id });
          this.selectedItems = res.data.items.map((item: any) => ({
            id: item.inventory.id,
            code: item.inventory.code,
            name: item.inventory.name,
            quantity: item.quantity,
            unit: item.inventory.unit
          }));

          this.loading = false;
        },
        error: () => this.loading = false
      });
  }

  onSupplierChange() {
    this.selectedItems = [];
    const supplierId = this.acquisitionForm.value.supplierId;

    if (supplierId) {
      this.inventoryService.getInventoryBySupplier(supplierId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(res => {
          if (res.succeeded) this.inventoryList = res.data;
        });
    }
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
    if (this.acquisitionForm.invalid || this.selectedItems.length === 0 || this.loading) {
      this.notification.warning('Warning', 'Please fill required fields and add at least one item.');
      return;
    }

    let hasError = false;

    this.selectedItems.forEach(item => {
      if (item.quantity == null || item.quantity < 1 || !this.isInteger(item.quantity)) {
        hasError = true;
      }
    });

    if (hasError) {
      this.message.error('Please correct quantity errors.');
      return;
    }

    const obj: any = {
      Id: this.acquisitionId,
      SupplierId: this.acquisitionForm.value.supplierId,
      IsDraft: isDraft,
      Items: this.selectedItems.map(item => ({
        InventoryId: item.id,
        Quantity: item.quantity
      }))
    };

    const proceedSave = () => {
      this.loading = true;
      var serviceCall = (this.mode === 'create') ?
        this.acquisitionService.createAcquisition(obj) : this.acquisitionService.updateAcquisition(this.acquisitionId, obj);
      serviceCall
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            this.notification.success('Success', res.message);

            if (!isDraft) {
              // After create, now generate PDF
              this.acquisitionService.generatePdf(res.data)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                  next: (res) => {
                    if (res.succeeded) {
                      this.modal.confirm({
                        nzTitle: 'Purchase Order Generated',
                        nzContent: 'Purcahse order generated successfully. Do you want to send it now?',
                        nzOnOk: () => {
                          this.acquisitionService.sendPdf(res.data)
                            .pipe(takeUntil(this.destroy$))
                            .subscribe(() => {
                              this.notification.success('Sent', 'Acquisition sent successfully');
                              this.modalRef.close(true);
                            });
                        },
                        nzOnCancel: () => this.modalRef.close(true)
                      });
                    }
                  },
                  error: () => {
                    this.notification.error('Error', 'PDF generation failed.');
                    this.loading = false;
                  }
                });
            } else {
              // If draft, just close
              this.modalRef.close(true);
            }
          },
          error: () => this.loading = false
        });
    };

    if (!isDraft) {
      this.modal.confirm({
        nzTitle: 'Confirm Submission',
        nzContent: 'Once submitted, you cannot edit this acquisition. Proceed?',
        nzOnOk: () => proceedSave()
      });
    } else {
      proceedSave();
    }
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
      case 'Created': return 'status-created';
      case 'Sent': return 'status-sent';
      case 'Received': return 'status-received';
      default: return '';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
