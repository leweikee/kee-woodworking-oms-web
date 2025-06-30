import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class SupplierManagementService {
  private apiBaseUrl = environment.apiBaseUrl

  constructor(private http: HttpClient) {}

  getAllSuppliers(request: any): Observable<any> {
    let params = new HttpParams()
      .set('PageNumber', request.PageNumber)
      .set('PageSize', request.PageSize)
      .set('Search', request.Search);
    return this.http.get(`${this.apiBaseUrl}/v1/supplier`, { params });
  }

  getSupplierById(id: string): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/v1/supplier/${id}`);
  }

  createSupplier(request: any): Observable<any> {
    return this.http.post(`${this.apiBaseUrl}/v1/supplier`, request);
  }

  updateSupplier(id: string, request: any): Observable<any> {
    return this.http.put(`${this.apiBaseUrl}/v1/supplier/${id}`, request);
  }

  deleteSupplier(id: string): Observable<any> {
    return this.http.delete(`${this.apiBaseUrl}/v1/supplier/${id}`);
  }
}
