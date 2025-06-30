import { Component, Input, OnInit } from '@angular/core';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTableModule } from 'ng-zorro-antd/table';
import { ReactiveFormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
    selector: 'app-select-inventory-modal',
    standalone: true,
    templateUrl: './select-inventory-modal.component.html',
    styleUrl: './select-inventory-modal.component.scss',
    imports: [CommonModule, FormsModule, NzInputModule, NzTableModule,
        ReactiveFormsModule, NzIconModule, NzButtonModule]
})
export class SelectInventoryModalComponent implements OnInit {
    @Input() inventoryList: any[] = [];
    @Input() selected: any[] = [];
    @Input() title: string = 'Select Inventory';
    @Input() allowMultiple: boolean = false;

    public searchControl = new FormControl('');
    public filteredList: any[] = [];
    public tempSelected: any[] = [];
    public selectedIds = new Set<number>();

    constructor(private modalRef: NzModalRef) { }

    ngOnInit(): void {
        // Sync selection for each item in inventory
        this.selected.forEach(item => {
            this.selectedIds.add(item.id);
        });

        this.filteredList = this.inventoryList;

        this.searchControl.valueChanges.subscribe(search => {
            const term = (search ?? '').toLowerCase();
            this.filteredList = this.inventoryList.filter(item =>
                item.code.toLowerCase().includes(term) || item.name.toLowerCase().includes(term)
            );
        });
    }

    resetSearch(): void {
        this.searchControl.reset();
        this.filteredList = this.inventoryList;
    }

    isChecked(item: any): boolean {
        return this.selectedIds.has(item.id);
    }

    toggleSelection(item: any, event: any): void {
        if (event.target.checked) {
            this.selectedIds.add(item.id);
        } else {
            this.selectedIds.delete(item.id);
        }
    }

    selectItem(item: any): void {
        this.selectedIds.clear();
        this.selectedIds.add(item.id);
    }

    confirmSelection() {
        const selectedItems = this.inventoryList.filter(item => this.selectedIds.has(item.id));
        this.modalRef.close(selectedItems);
    }

    trackById(index: number, item: any): any {
        return item.id;
    }

    onCheckboxChange(changedItem: any): void {
        // Ensure change applies back to inventoryList (by reference it's already safe, but this double check)
        const target = this.inventoryList.find(item => item.id === changedItem.id);
        if (target) {
            target.selected = changedItem.selected;
        }
    }

    cancel() {
        this.modalRef.close();
    }
}
