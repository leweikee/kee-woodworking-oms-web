import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardManagementService {
  private apiBaseUrl = environment.apiBaseUrl

  constructor(private http: HttpClient) {}

  getAdminDashboard(): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/v1/dashboard/admin`);
  }

  getOrderDashboard(): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/v1/dashboard/order`);
  }

  getInventoryDashboard(): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/v1/dashboard/inventory`);
  }
}
