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
import { InventoryManagementService } from '../inventory-management.service'
import { NzMessageService } from 'ng-zorro-antd/message';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { InventoryFormComponent } from '../inventory-form/inventory-form.component';
import { AuthService } from '../../core/auth/auth.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';

@Component({
  selector: 'app-inventory-listing',
  standalone: true,
  imports: [
    NzTableModule, NzIconModule, NzGridModule, NzSpaceModule,
    NzSpinModule, NzInputModule, NzButtonModule, NzModalModule,
    CommonModule, ReactiveFormsModule, NzSelectModule
  ],
  templateUrl: './inventory-listing.component.html',
  styleUrl: './inventory-listing.component.scss'
})
export class InventoryListingComponent implements OnInit, OnDestroy {
  public columns: any = [];
  public inventoryList: any = [];
  public loading = false;
  public hasAccess: any;

  public pageSize = 10;
  public pageNumber = 1;
  public totalCount = 0;
  public searchControl = new FormControl('');
  public categoryControl = new FormControl('');
  public stockLevelControl = new FormControl('');

  public categoryList = [
    { value: 'Materials', label: 'Materials' },
    { value: 'Consumables', label: 'Consumables' },
    { value: 'Hardware', label: 'Hardware' }
  ];

  public levelList = [
    { value: 'Above Min', label: 'Above Min' },
    { value: 'Equal Min', label: 'Equal Min' },
    { value: 'Below Min', label: 'Below Min' }
  ];

  private destroy$ = new Subject<void>();
  private currentUser: any;

  constructor(private inventoryService: InventoryManagementService, private message: NzMessageService, private modal: NzModalService,
    private authService: AuthService, private notification: NzNotificationService
  ) {
    this.currentUser = this.authService.currentUserValue;
  }

  ngOnInit(): void {
    this.hasAccess = this.currentUser.roles.includes('Admin') || this.currentUser.roles.includes('Inventory');
    this.columns = this.getColumns();
    this.loadInventories();
    this.searchControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageNumber = 1;
        this.loadInventories();
      });

    this.categoryControl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageNumber = 1;
        this.loadInventories();
      });

    this.stockLevelControl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageNumber = 1;
        this.loadInventories();
      });
  }

  getColumns() {
    return [
      { field: 'code', header: 'Code' },
      { field: 'name', header: 'Name' },
      { field: 'category', header: 'Category' },
      { field: 'totalQty', header: 'Total' },
      { field: 'reservedQty', header: 'Reserved' },
      { field: 'availableQty', header: 'Available' },
      { field: 'unit', header: 'Unit' },
      { field: 'lastUnitPrice', header: 'Last U.Price (RM)' },
      { field: 'averageUnitPrice', header: 'Average U.Price (RM)' },
      { field: 'lastInDate', header: 'Last In. Date' },
      { field: 'lastOutDate', header: 'Last Out. Date' },
    ]
  }

  loadInventories() {
    this.loading = true;
    const obj = {
      PageNumber: this.pageNumber,
      PageSize: this.pageSize,
      Search: this.searchControl.value?.trim() || '',
      Category: this.categoryControl.value || '',
      StockLevel: this.stockLevelControl.value || ''
    };
    this.inventoryService.getAllInventories(obj)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.succeeded && response.data) {
            this.inventoryList = response.data;
            this.totalCount = response.totalCount;
          }
          this.loading = false;
        },
        error: () => {
          this.notification.error('Error', 'Failed to load inventories');
          this.loading = false;
        }
      });
  }

  getStockLevel(data: any): string {
    if (data.availableQty > data.minQty) {
      return 'Above Min';
    } else if (data.availableQty === data.minQty) {
      return 'Equal Min';
    } else if (data.availableQty < data.minQty) {
      return 'Below Min';
    } else {
      return '';
    }
  }

  onPageChange(pageNumber: number) {
    this.pageNumber = pageNumber;
    this.loadInventories();
  }

  resetSearch() {
    this.searchControl.reset();
    this.pageNumber = 1;
    this.loadInventories();
  }

  createInventory() {
    const modalRef = this.modal.create({
      nzTitle: 'Create New Inventory',
      nzContent: InventoryFormComponent,
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
        this.loadInventories();
      }
      else if (resp && resp.reactivateId) {
        this.promptReactivation(resp.reactivateId, resp.reactivateMessage);
      }
    });
  }

  promptReactivation(Id: number, message: string) {
    this.modal.confirm({
      nzTitle: 'Reactivate Inventory?',
      nzContent: message,
      nzOkText: 'Yes, Reactivate',
      nzOnOk: () => {
        this.openReactivationForm(Id);
      },
      nzCancelText: 'Cancel',
    });
  }

  openReactivationForm(Id: number) {
    const modalRef = this.modal.create({
      nzTitle: 'Reactivate Inventory',
      nzContent: InventoryFormComponent,
      nzData: { id: Id, reactivateMode: true },
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
        this.loadInventories();
      }
    });
  }

  editInventory(data: any) {
    const modalRef = this.modal.create({
      nzTitle: 'Edit Inventory',
      nzContent: InventoryFormComponent,
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
        this.loadInventories();
      }
    });
  }

  confirmDelete(data: any) {
    this.modal.confirm({
      nzTitle: 'Are you sure delete this Inventory?',
      nzOkText: 'Yes',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.deleteInventory(data),
      nzCancelText: 'No',
      nzOnCancel: () => { },
    })
  }

  deleteInventory(data: any) {
    this.loading = true;
    this.inventoryService.deleteInventory(data.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.succeeded) {
            this.notification.success('Success', response.message);
            this.loading = false;
            this.loadInventories();
          }
        },
        error: (error) => {
          this.notification.error('Error', `${error.error.Message}`);
          this.loading = false;
        }
      })
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

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
