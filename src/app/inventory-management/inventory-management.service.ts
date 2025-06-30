import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class InventoryManagementService {
  private apiBaseUrl = environment.apiBaseUrl

  constructor(private http: HttpClient) {}

  getAllInventories(request: any): Observable<any> {
    let params = new HttpParams()
      .set('PageNumber', request.PageNumber)
      .set('PageSize', request.PageSize)
      .set('Search', request.Search)
      .set('StockLevel', request.StockLevel)
      .set('Category', request.Category);
    return this.http.get(`${this.apiBaseUrl}/v1/inventory`, { params });
  }

  getAllInventoriesWithNoSupplier(): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/v1/inventory/noSupplier`);
  }

  getInventoryById(id: string): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/v1/inventory/${id}`);
  }

  getInventoryBySupplier(id: string): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/v1/inventory/supplier/${id}`);
  }

  getInventoryByCategory(category: string): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/v1/inventory/category/${category}`);
  }

  createInventory(request: any): Observable<any> {
    return this.http.post(`${this.apiBaseUrl}/v1/inventory`, request);
  }

  updateInventory(id: string, request: any): Observable<any> {
    return this.http.put(`${this.apiBaseUrl}/v1/inventory/${id}`, request);
  }

  deleteInventory(id: string): Observable<any> {
    return this.http.delete(`${this.apiBaseUrl}/v1/inventory/${id}`);
  }

  reactivateInventory(id: string, request: any): Observable<any> {
    return this.http.post(`${this.apiBaseUrl}/v1/inventory/${id}/activate`, request);
  }
}
