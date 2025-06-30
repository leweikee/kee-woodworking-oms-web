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
import { InboundManagementService } from '../inbound-management.service'
import { NzMessageService } from 'ng-zorro-antd/message';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/auth/auth.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { InboundFormComponent } from '../inbound-form/inbound-form.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-inbound-listing',
  standalone: true,
  imports: [
    NzTableModule, NzIconModule, NzGridModule, NzSpaceModule,
    NzSpinModule, NzInputModule, NzButtonModule, NzModalModule,
    CommonModule, ReactiveFormsModule, NzSelectModule, NzToolTipModule, FormsModule
  ],
  templateUrl: './inbound-listing.component.html',
  styleUrl: './inbound-listing.component.scss'
})
export class InboundListingComponent implements OnInit, OnDestroy {
  @ViewChild('reasonTemplate', { static: true }) reasonTemplate!: TemplateRef<any>;
  public reverseReason: string = '';
  public columns: any = [];
  public inboundList: any = [];
  public loading = false;

  public pageSize = 10;
  public pageNumber = 1;
  public totalCount = 0;
  public searchControl = new FormControl('');
  public categoryControl = new FormControl('');

  public categoryList = [
    { value: 'Materials', label: 'Materials' },
    { value: 'Consumables', label: 'Consumables' },
    { value: 'Hardware', label: 'Hardware' }
  ];

  private destroy$ = new Subject<void>();
  private currentUser: any;

  constructor(private inboundService: InboundManagementService, private message: NzMessageService, private modal: NzModalService,
    private authService: AuthService, private notification: NzNotificationService
  ) {
    this.currentUser = this.authService.currentUserValue;
  }

  ngOnInit(): void {
    this.columns = this.getColumns();
    this.loadInbounds();
    this.searchControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageNumber = 1;
        this.loadInbounds();
      });

    this.categoryControl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageNumber = 1;
        this.loadInbounds();
      });
  }

  getColumns() {
    return [
      { field: 'created', header: 'In. Date' },
      { field: 'code', header: 'Code' },
      { field: 'name', header: 'Name' },
      { field: 'category', header: 'Category' },
      { field: 'quantity', header: 'Quantity' },
      { field: 'remainingQuantity', header: 'Remaining' },
      { field: 'unit', header: 'Unit' },
      { field: 'unitPrice', header: 'U.Price (RM)' },
      { field: 'totalPrice', header: 'Total (RM)' },
    ]
  }

  loadInbounds() {
    this.loading = true;
    const obj = {
      PageNumber: this.pageNumber,
      PageSize: this.pageSize,
      Search: this.searchControl.value?.trim() || '',
      Category: this.categoryControl.value || ''
    };
    this.inboundService.getAllInbounds(obj)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.succeeded && response.data) {
            this.inboundList = response.data;
            this.totalCount = response.totalCount;
          }
          this.loading = false;
        },
        error: () => {
          this.notification.error('Error', 'Failed to load inbounds');
          this.loading = false;
        }
      });
  }

  onPageChange(pageNumber: number) {
    this.pageNumber = pageNumber;
    this.loadInbounds();
  }

  resetSearch() {
    this.searchControl.reset();
    this.pageNumber = 1;
    this.loadInbounds();
  }

  createInbound() {
    const modalRef = this.modal.create({
      nzTitle: 'Create New Inbound(s)',
      nzContent: InboundFormComponent,
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
        this.loadInbounds();
      }
    });
  }

  confirmReverse(data: any) {
    this.modal.create({
      nzTitle: 'Reverse Reason',
      nzContent: this.reasonTemplate, 
      nzOkText: 'Confirm',
      nzOnOk: () => {
        const reason = (document.getElementById('reverseReason') as HTMLTextAreaElement)?.value?.trim();
        if (!reason) {
          this.message.error('Reason is required');
          return Promise.reject();  // Keeps modal open
        }

        return new Promise((resolve, reject) => {
          this.reverseInbound(data.id, reason, resolve, reject);
        });
      },
      nzCancelText: 'Cancel',
      nzClosable: false,
      nzMaskClosable: false
    });
  }

  reverseInbound(id: string, reason: string, resolve: Function, reject: Function) {
    this.loading = true;
    const obj = { Reason: reason };
    this.inboundService.reverseInbound(id, obj)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.succeeded) {
            this.loading = false;
            this.notification.success('Success', response.message);
            this.loadInbounds();
            resolve();
          }
        },
        error: (error) => {
          this.notification.error('Error', error.error?.Message || 'Reverse failed');
          this.loading = false;
          reject();
        }
      });
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

  formatAcquisitionId(id: number): string {
    return id.toString().padStart(4, '0');
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
