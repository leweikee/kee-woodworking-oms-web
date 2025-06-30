import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
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
import { OrderManagementService } from '../order-management.service'
import { NzMessageService } from 'ng-zorro-antd/message';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { OrderFormComponent } from '../order-form/order-form.component';
import { AuthService } from '../../core/auth/auth.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

@Component({
  selector: 'app-order-listing',
  standalone: true,
  imports: [
    NzTableModule, NzIconModule, NzGridModule, NzSpaceModule,
    NzSpinModule, NzInputModule, NzButtonModule, NzModalModule,
    CommonModule, ReactiveFormsModule, NzSelectModule, NzToolTipModule
  ],
  templateUrl: './order-listing.component.html',
  styleUrl: './order-listing.component.scss'
})
export class OrderListingComponent implements OnInit, OnDestroy {
  @ViewChild('dateTemplate', { static: true }) dateTemplate!: TemplateRef<any>;
  public columns: any = [];
  public orderList: any = [];
  public loading = false;
  public hasAccess = false;

  public pageSize = 10;
  public pageNumber = 1;
  public totalCount = 0;
  public searchControl = new FormControl('');
  public statusControl = new FormControl('');

  public statusList = [
    { value: 'Draft', label: 'Draft' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Created', label: 'Created' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Invoiced', label: 'Invoiced' },
    { value: 'Delivered', label: 'Delivered' },
  ];

  private destroy$ = new Subject<void>();
  private currentUser: any;

  constructor(private orderService: OrderManagementService, private message: NzMessageService, private modal: NzModalService,
    private authService: AuthService, private notification: NzNotificationService
  ) {
    this.currentUser = this.authService.currentUserValue;
  }

  ngOnInit(): void {
    this.hasAccess = this.currentUser.roles.includes('Admin') || this.currentUser.roles.includes('Order');
    this.columns = this.getColumns();
    this.loadOrders();

    this.searchControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageNumber = 1;
        this.loadOrders();
      });

    this.statusControl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageNumber = 1;
        this.loadOrders();
      });
  }

  getColumns() {
    return [
      { field: 'id', header: 'OPO No' },
      { field: 'status', header: 'Status' },
      { field: 'receivedDate', header: 'Issued At' },
      { field: 'deliveryDate', header: 'Delivered At' },
      { field: 'model', header: 'Model' },
      { field: 'modelCode', header: 'Code' },
      { field: 'modelCategory', header: 'Category' },
      { field: 'quantity', header: 'Qty' },
      { field: 'totalRevenue', header: 'Revenue (RM)' },
      { field: 'createdBy', header: 'Created' },
      { field: 'lastModifiedBy', header: ' Last Updated' }
    ]
  }

  loadOrders() {
    this.loading = true;
    const obj = {
      PageNumber: this.pageNumber,
      PageSize: this.pageSize,
      Search: this.searchControl.value?.trim() || '',
      Status: this.statusControl.value || ''
    };
    this.orderService.getAllOrders(obj)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.succeeded && response.data) {
            this.orderList = response.data;
            this.totalCount = response.totalCount;
          }
          this.loading = false;
        },
        error: () => {
          this.notification.error('Error', 'Failed to load orders');
          this.loading = false;
        }
      });
  }

  onPageChange(pageNumber: number) {
    this.pageNumber = pageNumber;
    this.loadOrders();
  }

  resetSearch() {
    this.searchControl.reset();
    this.pageNumber = 1;
    this.loadOrders();
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

  formatOPONo(id: number): string {
    return id.toString().padStart(6, '0');
  }

  viewOrder(data: any) {
    const modalRef = this.modal.create({
      nzTitle: `OPO${this.formatOPONo(data.id)}`,
      nzContent: OrderFormComponent,
      nzData: { id: data.id, mode: 'view' },
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
        this.loadOrders();
      }
    });
  }

  createOrder() {
    const modalRef = this.modal.create({
      nzTitle: 'Create New Order',
      nzContent: OrderFormComponent,
      nzData: { id: null, mode: 'create' },
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
        this.loadOrders();
      }
    });
  }

  editOrder(data: any) {
    const modalRef = this.modal.create({
      nzTitle: 'Edit Order',
      nzContent: OrderFormComponent,
      nzData: { id: data.id, mode: 'edit' },
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
        this.loadOrders();
      }
    });
  }

  confirmDelete(data: any) {
    this.modal.confirm({
      nzTitle: 'Are you sure delete this Order?',
      nzContent: '<b>This action will permanently delete the order.</b>',
      nzOkText: 'Yes',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.deleteOrder(data),
      nzCancelText: 'No',
      nzOnCancel: () => { },
    })
  }

  deleteOrder(data: any) {
    this.loading = true;
    this.orderService.deleteOrder(data.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.succeeded) {
            this.notification.success('Success', response.message);
            this.loading = false;
            this.loadOrders();
          }
        },
        error: (error) => {
          this.notification.error('Error', `${error.error.Message}`);
          this.loading = false;
        }
      })
  }

  updateStatus(data: any, nextStatus: string) {
    this.loading = true;
    this.orderService.updateOrderStatus(data.id, { Id: data.id, Status: nextStatus })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.notification.success('Status Updated', `Order moved to ${nextStatus}`);
          this.loadOrders();
        },
        error: () => {
          this.notification.error('Error', 'Failed to update status');
          this.loading = false;
        }
      });
  }

  markCompleted(data: any) {
    this.loading = true;
    this.orderService.completeOrder(data.id, { Id: data.id })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.notification.success('Completed', 'Order marked as Completed.');

          this.orderService.generateInvoice(data.id).subscribe({
            next: (genRes) => {
              if (genRes.succeeded) {
                this.modal.confirm({
                  nzTitle: 'Invoice Generated',
                  nzContent: 'Do you want to send the invoice now?',
                  nzOnOk: () => this.confirmSend(data.id)
                });
              } else {
                this.notification.error('Error', 'Invoice generation failed.');
              }
            },
            error: () => {
              this.notification.error('Error', 'Invoice generation failed.');
            }
          });

          this.loadOrders();
        },
        error: () => {
          this.notification.error('Error', 'Failed to mark as Completed');
          this.loading = false;
        }
      });
  }

  sendOrder(data: any) {
    if (data.filePath) {
      this.openSendModal(data.id);
    } else {
      this.orderService.generateInvoice(data.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            if (res.succeeded) {
              this.notification.success('Success', 'Invoice generated.');
              this.openSendModal(data.id);
            }
          },
          error: () => this.notification.error('Error', 'Invoice generation failed.')
        });
    }
  }

  openSendModal(id: string) {
    this.modal.confirm({
      nzTitle: 'Invoice Ready',
      nzContent: 'Send this invoice now?',
      nzOkText: 'Send Now',
      nzOnOk: () => this.confirmSend(id)
    });
  }

  downloadInvoice(data: any) {
    window.open(data.filePath, '_blank');
  }

  confirmSend(id: string) {
    this.orderService.sendInvoice(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.succeeded) {
            this.notification.success('Success', 'Invoice sent successfully.');
            this.loadOrders(); // Refresh list if needed
          } else {
            this.notification.error('Error', res.message || 'Failed to send invoice.');
          }
        },
        error: () => {
          this.notification.error('Error', 'Failed to send invoice.');
        }
      });
  }

  updateStatusToDelivered(data: any) {
    const modalRef = this.modal.create({
      nzTitle: 'Mark as Delivered',
      nzContent: this.dateTemplate,
      nzOnOk: () => {
        const deliveredDateStr = (document.getElementById('delivered') as HTMLInputElement).value;
        if (!deliveredDateStr) {
          this.message.error('Please select delivered date.');
          return Promise.reject();
        }

        const deliveredDate = new Date(deliveredDateStr);
        const createdDate = new Date(data.receivedDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Ensure date-only comparison
        const deliveredDateOnly = new Date(deliveredDate.getFullYear(), deliveredDate.getMonth(), deliveredDate.getDate());
        const createdDateOnly = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        if (deliveredDateOnly < createdDateOnly) {
          this.message.error('Delivered date cannot be before the issued date.');
          return Promise.reject();
        }

        if (deliveredDateOnly > todayOnly) {
          this.message.error('Delivered date cannot be in the future.');
          return Promise.reject();
        }
        
        this.loading = true;
        return this.orderService.updateOrderStatus(data.id, {
          Id: data.id,
          Status: 'Delivered',
          ActualDelDate: deliveredDate
        }).toPromise().then(() => {
          this.notification.success('Delivered', 'Order marked as Delivered.');
          this.loadOrders();
        }).catch(() => {
          this.notification.error('Error', 'Failed to update status.');
          this.loading = false;
        });
      }
    });
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

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
