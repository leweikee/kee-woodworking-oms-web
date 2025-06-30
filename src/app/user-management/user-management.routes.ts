import { Routes } from '@angular/router';
import { UserListingComponent } from './user-listing/user-listing.component';

export const userManagementRoutes: Routes = [
  { path: '', component: UserListingComponent },
];