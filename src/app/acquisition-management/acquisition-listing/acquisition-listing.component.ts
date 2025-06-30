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
import { AcquisitionManagementService } from '../acquisition-management.service'
import { NzMessageService } from 'ng-zorro-antd/message';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AcquisitionFormComponent } from '../acquisition-form/acquisiton-form.component';
import { AuthService } from '../../core/auth/auth.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { InboundFormComponent } from '../../inventory-management/movements-management/inbound-management/inbound-form/inbound-form.component';

@Component({
  selector: 'app-acquisition-listing',
  standalone: true,
  imports: [
    NzTableModule, NzIconModule, NzGridModule, NzSpaceModule,
    NzSpinModule, NzInputModule, NzButtonModule, NzModalModule,
    CommonModule, ReactiveFormsModule, NzSelectModule
  ],
  templateUrl: './acquisition-listing.component.html',
  styleUrl: './acquisition-listing.component.scss'
})
export class AcquisitionListingComponent implements OnInit, OnDestroy {
  @ViewChild('dateTemplate', { static: true }) dateTemplate!: TemplateRef<any>;
  public columns: any = [];
  public acquisitionList: any = [];
  public loading = false;
  public hasAccess = false;

  public pageSize = 10;
  public pageNumber = 1;
  public totalCount = 0;
  public searchControl = new FormControl('');
  public statusControl = new FormControl('');

  public statusList = [
    { value: 'Draft', label: 'Draft' },
    { value: 'Created', label: 'Created' },
    { value: 'Sent', label: 'Sent' },
    { value: 'Received', label: 'Received' }
  ];

  private destroy$ = new Subject<void>();
  private currentUser: any;

  constructor(private acquisitionService: AcquisitionManagementService, private message: NzMessageService, private modal: NzModalService,
    private authService: AuthService, private notification: NzNotificationService
  ) {
    this.currentUser = this.authService.currentUserValue;
  }

  ngOnInit(): void {
    this.hasAccess = this.currentUser.roles.includes('Admin') || this.currentUser.roles.includes('Inventory');
    this.columns = this.getColumns();
    this.loadAcquisitions();
    this.searchControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageNumber = 1;
        this.loadAcquisitions();
      });

    this.statusControl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageNumber = 1;
        this.loadAcquisitions();
      });
  }

  getColumns() {
    return [
      { field: 'id', header: 'AC. No' },
      { field: 'created', header: 'Created At' },
      { field: 'receivedDate', header: 'Received At' },
      { field: 'totalItems', header: 'Total Items' },
      { field: 'supplierName', header: 'Supplier' },
      { field: 'createdBy', header: 'Created By' },
      { field: 'lastModifiedBy', header: 'Last Updated By' },
      { field: 'status', header: 'Status' }
    ]
  }

  loadAcquisitions() {
    this.loading = true;
    const obj = {
      PageNumber: this.pageNumber,
      PageSize: this.pageSize,
      Search: this.searchControl.value?.trim() || '',
      Status: this.statusControl.value || ''
    };
    this.acquisitionService.getAllAcquisitions(obj)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.succeeded && response.data) {
            this.acquisitionList = response.data;
            this.totalCount = response.totalCount;
          }
          this.loading = false;
        },
        error: () => {
          this.notification.error('Error', 'Failed to load acquisitions');
          this.loading = false;
        }
      });
  }

  onPageChange(pageNumber: number) {
    this.pageNumber = pageNumber;
    this.loadAcquisitions();
  }

  resetSearch() {
    this.searchControl.reset();
    this.pageNumber = 1;
    this.loadAcquisitions();
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

  formatAcNo(id: number): string {
    return 'AC' + id.toString().padStart(4, '0');
  }

  viewAcquisition(data: any) {
    const modalRef = this.modal.create({
      nzTitle: this.formatAcNo(data.id),
      nzContent: AcquisitionFormComponent,
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
        this.loadAcquisitions();
      }
    });
  }

  createAcquisition() {
    const modalRef = this.modal.create({
      nzTitle: 'Create New Acquisition',
      nzContent: AcquisitionFormComponent,
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
        this.loadAcquisitions();
      }
    });
  }

  editAcquisition(data: any) {
    const modalRef = this.modal.create({
      nzTitle: 'Edit Acquisition',
      nzContent: AcquisitionFormComponent,
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
        this.loadAcquisitions();
      }
    });
  }

  confirmDelete(data: any) {
    this.modal.confirm({
      nzTitle: 'Are you sure delete this Acquisition?',
      nzContent: '<b>This action will permanently delete the acquisition.</b>',
      nzOkText: 'Yes',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.deleteAcquisition(data),
      nzCancelText: 'No',
      nzOnCancel: () => { },
    })
  }

  deleteAcquisition(data: any) {
    this.loading = true;
    this.acquisitionService.deleteAcquisition(data.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.succeeded) {
            this.notification.success('Success', response.message);
            this.loading = false;
            this.loadAcquisitions();
          }
        },
        error: (error) => {
          this.notification.error('Error', `${error.error.Message}`);
          this.loading = false;
        }
      })
  }

  downloadPdf(data: any) {
    window.open(data.filePath, '_blank');
  }

  sendAcquisition(data: any) {
    if (data.filePath) {
      // Already has PDF, directly prompt send
      this.openSendModal(data.id);
    } else {
      // No PDF yet, generate first
      this.acquisitionService.generatePdf(data.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            if (res.succeeded) {
              this.notification.success('Success', 'Purchase order generated successfully.');
              this.openSendModal(data.id);
            } else {
              this.notification.error('Error', 'Purchase order generation failed.');
            }
          },
          error: () => {
            this.notification.error('Error', 'Failed to generate PDF.');
          }
        });
    }
  }

  openSendModal(id: string) {
    this.modal.confirm({
      nzTitle: 'Purchase Order Ready',
      nzContent: 'Do you want to send this acquisition now?',
      nzOkText: 'Send Now',
      nzCancelText: 'Cancel',
      nzOnOk: () => this.confirmSend(id),
      nzOnCancel: () => this.loadAcquisitions()
    });
  }

  confirmSend(id: string) {
    this.acquisitionService.sendPdf(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.succeeded) {
            this.notification.success('Success', 'Acquisition sent successfully.');
            this.loadAcquisitions(); // Refresh list if needed
          } else {
            this.notification.error('Error', res.message || 'Failed to send acquisition.');
          }
        },
        error: () => {
          this.notification.error('Error', 'Failed to send acquisition.');
        }
      });
  }

  updateStatusToReceived(data: any) {
    let modalRef = this.modal.create({
      nzTitle: 'Mark as Received',
      nzContent: this.dateTemplate,
      nzOnOk: () => {
        const rd = (document.getElementById('received') as HTMLInputElement).value;
        if (!rd) {
          this.message.error('Please select received date.');
          return Promise.reject();
        }

        const receivedDate = new Date(rd);
        const createdDate = new Date(data.created);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Ensure date-only comparison
        const receivedDateOnly = new Date(receivedDate.getFullYear(), receivedDate.getMonth(), receivedDate.getDate());
        const createdDateOnly = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        if (receivedDateOnly < createdDateOnly) {
          this.message.error('Received date cannot be before the created date.');
          return Promise.reject();
        }

        if (receivedDateOnly > todayOnly) {
          this.message.error('Received date cannot be in the future.');
          return Promise.reject();
        }

        this.loading = true;
        return this.acquisitionService.updateAcquisitionStatus(data.id, { Id: data.id, Status: 'Received', ReceivedDate: rd })
          .toPromise().then(res => {
            this.loading = false;
            this.notification.success('Received', 'Status updated.');
            this.openInboundModal(data.id);
          }).catch(() => {
            this.loading = false;
            this.notification.error('Error', 'Failed update');
          });
      }
    });
  }

  openInboundModal(acquisitionId: string) {
    const inboundModalRef = this.modal.create({
      nzTitle: `Create Inbound for ${this.formatAcNo(parseInt(acquisitionId))}`,
      nzContent: InboundFormComponent,
      nzData: { id: acquisitionId },
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

    inboundModalRef.afterClose.subscribe((resp) => {
      if (resp === true) {
        this.loadAcquisitions();
      }
    });
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

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
