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
import { ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { InboundManagementService } from '../inbound-management.service';
import { InventoryManagementService } from '../../../inventory-management.service';
import { AcquisitionManagementService } from '../../../../acquisition-management/acquisition-management.service';
import { NZ_MODAL_DATA, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { FormsModule } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SelectInventoryModalComponent } from '../../../select-inventory/select-inventory-modal.component';

@Component({
  selector: 'app-inbound-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, NzFormModule, NzDividerModule, NzTableModule,
    NzButtonModule, NzSelectModule, NzIconModule, NzInputModule, NzSpinModule, FormsModule
  ],
  templateUrl: './inbound-form.component.html',
  styleUrl: './inbound-form.component.scss'
})
export class InboundFormComponent implements OnInit, OnDestroy {
  public loading = false;
  public acquisitionId: string = '';
  public selectedItems: any[] = [];
  public inventoryList: any[] = [];
  public serverValidationErrors: string[] = [];

  private destroy$ = new Subject<void>();

  constructor(private inventoryService: InventoryManagementService,
    private acquisitionService: AcquisitionManagementService,
    private inboundService: InboundManagementService,
    private modalRef: NzModalRef,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private message: NzMessageService,
    @Inject(NZ_MODAL_DATA) private data: any) { }

  ngOnInit(): void {
    this.acquisitionId = this.data?.id ?? null;

    if (this.acquisitionId) {
      this.loadAcquisitionItems();
    } else {
      this.loadInventories();
    }
  }

  loadAcquisitionItems() {
    this.loading = true;
    this.acquisitionService.getAcquisitionById(this.acquisitionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.succeeded && res.data?.items) {
            this.selectedItems = res.data.items.map((item: any) => ({
              id: item.inventory.id,
              code: item.inventory.code,
              name: item.inventory.name,
              unit: item.inventory.unit,
              quantity: item.quantity,
              unitPrice: 0
            }));
          }
          this.loading = false;
        },
        error: (err) => {
          this.notification.error('Error', err.message);
          this.loading = false;
        }
      });
  }

  loadInventories() {
    this.inventoryService.getAllInventoriesWithNoSupplier()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.succeeded && res.data) {
            this.inventoryList = res.data;
          }
        }
      });
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
    modalRef.componentInstance!.title = 'Select Inventory for Inbound';
    modalRef.componentInstance!.allowMultiple = true;

    modalRef.afterClose.subscribe((selected: any[] | any) => {
      if (selected) {
        // Keep previously entered quantity & unitPrice for still selected items
        const updated: any[] = [];

        (selected as any[]).forEach(item => {
          const existing = this.selectedItems.find(s => s.id === item.id);
          updated.push({
            ...item,
            quantity: existing ? existing.quantity : null,
            unitPrice: existing ? existing.unitPrice : null
          });
        });

        this.selectedItems = updated;
      }
    });
  };

  removeItem(id: number) {
    this.selectedItems = this.selectedItems.filter(x => x.id !== id);
  }

  onSave() {
    if (this.selectedItems.length === 0 || this.loading) {
      this.message.warning('Please select at least one item.');
      return;
    }

    let hasError = false;

    this.selectedItems.forEach(item => {
      if (
        item.quantity == null ||
        item.quantity < 1 ||
        !this.isInteger(item.quantity) ||
        item.unitPrice == null ||
        item.unitPrice < 0 ||
        !this.hasMaxFourDecimals(item.unitPrice)
      ) {
        hasError = true;
      }
    });

    if (hasError) {
      this.message.error('Please correct all quantity and unit price errors before saving.');
      return;
    }

    const obj: any = {
      AcquisitionId: this.acquisitionId,
      Items: this.selectedItems.map(item => ({
        InventoryId: item.id,
        Quantity: item.quantity,
        UnitPrice: item.unitPrice
      }))
    };

    this.loading = true;
    this.inboundService.createInboundBatch(obj)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.succeeded) {
            this.notification.success('Success', res.message);
            this.modalRef.close(true);
          }
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          if (err.error && err.error.errors) {
            this.serverValidationErrors = err.error.errors;
          } else {
            this.notification.error('Error', err.message);
          }
        }
      });
  }

  isInteger(value: any): boolean {
    return Number.isInteger(value);
  }

  hasMaxFourDecimals(value: any): boolean {
    const str = value?.toString();
    if (!str || str.indexOf('.') === -1) return true;
    return /^-?\d+(\.\d{0,4})?$/.test(value.toString());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
