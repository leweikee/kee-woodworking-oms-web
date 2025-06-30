import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderManagementService {
  private apiBaseUrl = environment.apiBaseUrl

  constructor(private http: HttpClient) {}

  getAllOrders(request: any): Observable<any> {
    let params = new HttpParams()
      .set('PageNumber', request.PageNumber)
      .set('PageSize', request.PageSize)
      .set('Search', request.Search)
      .set('Status', request.Status);
    return this.http.get(`${this.apiBaseUrl}/v1/order`, { params });
  }

  getOrderById(id: string): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/v1/order/${id}`);
  }

  createOrder(request: any): Observable<any> {
    return this.http.post(`${this.apiBaseUrl}/v1/order`, request);
  }

  completeOrder(id: string, request: any): Observable<any> {
    return this.http.post(`${this.apiBaseUrl}/v1/order/${id}/complete`, request);
  }

  generateInvoice(id: string): Observable<any> {
    return this.http.post(`${this.apiBaseUrl}/v1/order/${id}/invoice/generate`, id);
  }

  sendInvoice(id: string): Observable<any> {
    return this.http.post(`${this.apiBaseUrl}/v1/order/${id}/invoice/send`, id);
  }

  updateOrder(id: string, request: any): Observable<any> {
    return this.http.put(`${this.apiBaseUrl}/v1/order/${id}`, request);
  }

  updateOrderStatus(id: string, request: any): Observable<any> {
    return this.http.put(`${this.apiBaseUrl}/v1/order/${id}/status`, request);
  }

  deleteOrder(id: string): Observable<any> {
    return this.http.delete(`${this.apiBaseUrl}/v1/order/${id}`);
  }
}
