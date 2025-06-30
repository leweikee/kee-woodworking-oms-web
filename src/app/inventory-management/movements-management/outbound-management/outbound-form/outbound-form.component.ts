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
import { OutboundManagementService } from '../outbound-management.service';
import { InventoryManagementService } from '../../../inventory-management.service';
import { NZ_MODAL_DATA, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { FormsModule } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SelectInventoryModalComponent } from '../../../select-inventory/select-inventory-modal.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-outbound-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, NzFormModule, NzDividerModule, NzTableModule,
    NzButtonModule, NzSelectModule, NzIconModule, NzInputModule, NzSpinModule, FormsModule
  ],
  templateUrl: './outbound-form.component.html',
  styleUrl: './outbound-form.component.scss'
})
export class OutboundFormComponent implements OnInit, OnDestroy {
  public loading = false;
  public orderId: string = '';
  public selectedItems: any[] = [];
  public inventoryList: any[] = [];
  public serverValidationErrors: string[] = [];

  private destroy$ = new Subject<void>();

  constructor(private inventoryService: InventoryManagementService,
    private outboundService: OutboundManagementService,
    private modalRef: NzModalRef,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private message: NzMessageService,
    @Inject(NZ_MODAL_DATA) private data: any) { }

  ngOnInit(): void {
    this.loadInventories();
  }

  loadInventories() {
    forkJoin([
      this.inventoryService.getInventoryByCategory('Hardware'),
      this.inventoryService.getInventoryByCategory('Consumables')
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([hardwareRes, consumablesRes]) => {
          const combinedList: any[] = [];

          if (hardwareRes.succeeded && hardwareRes.data) {
            combinedList.push(...hardwareRes.data);
          }
          if (consumablesRes.succeeded && consumablesRes.data) {
            combinedList.push(...consumablesRes.data);
          }

          this.inventoryList = combinedList;
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
    modalRef.componentInstance!.allowMultiple = true;

    modalRef.afterClose.subscribe((selected: any[] | any) => {
      if (selected) {
        const updated: any[] = [];

        (selected as any[]).forEach(item => {
          const existing = this.selectedItems.find(s => s.id === item.id);
          updated.push({
            ...item,
            quantity: existing ? existing.quantity : null,
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
        item.quantity == null ||                             // Required
        item.quantity < 1 ||                                 // Minimum 1
        !this.isInteger(item.quantity) ||                    // Integer check
        (item.availableQty != null && item.quantity > item.availableQty) // Stock check
      ) {
        hasError = true;
      }
    });

    if (hasError) {
      this.message.error('Please fix quantity errors before saving.');
      return;
    }

    const obj: any = {
      Items: this.selectedItems.map(item => ({
        InventoryId: item.id,
        Quantity: item.quantity,
      }))
    };

    this.loading = true;
    this.outboundService.createOutboundBatch(obj)
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
