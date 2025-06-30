import { Routes } from '@angular/router';
import { InventoryListingComponent } from './inventory-listing/inventory-listing.component';
import { MovementsManagementComponent } from './movements-management/movements-management.component';

export const supplierManagementRoutes: Routes = [
  { path: '', component: InventoryListingComponent },
  { path: 'inventoriesMovements', component: MovementsManagementComponent}
];