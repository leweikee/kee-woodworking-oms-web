import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { AuthService } from '../core/auth/auth.service';
import { DashboardType } from '../enum/enum.component';
import { InventoryDashboardComponent } from "./inventory-dashboard/inventory-dashboard.component";
import { OrderDashboardComponent } from "./order-dashboard/order-dashboard.component";
import { AdminDashboardComponent } from "./admin-dashboard/admin-dashboard.component";

@Component({
  selector: 'app-dashboard-management',
  standalone: true,
  imports: [
    NzTabsModule, CommonModule,
    InventoryDashboardComponent,
    OrderDashboardComponent,
    AdminDashboardComponent
],
  templateUrl: './dashboard-management.component.html',
  styleUrl: './dashboard-management.component.scss'
})
export class DashboardManagementComponent implements OnInit {
  public userRoles: string[] = [];
  public DashboardType = DashboardType;

  public selectedTab: DashboardType = DashboardType.Admin;
  public selectedTabIndex: number = 0;

  public fullname: any;
  private currentUser: any;

  constructor(private authService: AuthService) {
    this.currentUser = this.authService.currentUserValue;
  }

  ngOnInit(): void {
    this.userRoles = this.currentUser?.roles ?? [];
    console.log(this.userRoles);

    if (this.userRoles.includes('Admin')) {
      this.selectedTabIndex = 0;
      this.selectedTab = DashboardType.Admin;
    } else if (this.userRoles.includes('Order')) {
      this.selectedTabIndex = 1;
      this.selectedTab = DashboardType.Order;
    } else if (this.userRoles.includes('Inventory')) {
      this.selectedTabIndex = 2;
      this.selectedTab = DashboardType.Inventory;
    }
  }

  onTabChange(index: number) {
    this.selectedTabIndex = index;
    if (index === 0) this.selectedTab = DashboardType.Admin;
    else if (index === 1) this.selectedTab = DashboardType.Order;
    else if (index === 2) this.selectedTab = DashboardType.Inventory;  }
}
