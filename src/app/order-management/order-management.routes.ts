import { Routes } from '@angular/router';
import { OrderListingComponent } from './order-listing/order-listing.component';

export const OrderManagementRoutes: Routes = [
  { path: '', component: OrderListingComponent },
];