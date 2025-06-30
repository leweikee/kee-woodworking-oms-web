import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guard/auth.guard';
import { LoginComponent } from './user-management/login/login.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { NgModule } from '@angular/core';
import { ChangePasswordComponent } from './user-management/change-password/change-password.component';
import { UserListingComponent } from './user-management/user-listing/user-listing.component';
import { SupplierListingComponent } from './supplier-management/supplier-listing/supplier-listing.component';
import { ProfileComponent } from './user-management/profile/profile.component';
import { InventoryListingComponent } from './inventory-management/inventory-listing/inventory-listing.component';
import { MovementsManagementComponent } from './inventory-management/movements-management/movements-management.component';
import { AcquisitionListingComponent } from './acquisition-management/acquisition-listing/acquisition-listing.component';
import { OrderListingComponent } from './order-management/order-listing/order-listing.component';
import { DashboardManagementComponent } from './dashboard-management/dashboard-management.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      { path: 'home', component: DashboardManagementComponent },

      { path: 'users', component: UserListingComponent, data: { roles: ['Admin'] }, canActivate: [AuthGuard]},
      { path: 'orders', component: OrderListingComponent },
      { path: 'suppliers', component: SupplierListingComponent },
      { path: 'inventories', component: InventoryListingComponent },
      { path: 'inventoriesMovements', component: MovementsManagementComponent, data: { roles: ['Admin', 'Inventory'] }, canActivate: [AuthGuard] },
      { path: 'acquisitions', component: AcquisitionListingComponent },

      { path: 'profile', component: ProfileComponent }
    ]
  },
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: '/login' },
      { path: 'login', component: LoginComponent },
      { path: 'change-password', component: ChangePasswordComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
