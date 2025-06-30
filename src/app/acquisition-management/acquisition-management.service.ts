import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class AcquisitionManagementService {
  private apiBaseUrl = environment.apiBaseUrl

  constructor(private http: HttpClient) {}

  getAllAcquisitions(request: any): Observable<any> {
    let params = new HttpParams()
      .set('PageNumber', request.PageNumber)
      .set('PageSize', request.PageSize)
      .set('Search', request.Search)
      .set('Status', request.Status);
    return this.http.get(`${this.apiBaseUrl}/v1/acquisition`, { params });
  }

  getAcquisitionById(id: string): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/v1/acquisition/${id}`);
  }

  createAcquisition(request: any): Observable<any> {
    return this.http.post(`${this.apiBaseUrl}/v1/acquisition`, request);
  }

  generatePdf(id: string): Observable<any> {
    return this.http.post(`${this.apiBaseUrl}/v1/acquisition/${id}/purchaseOrder/generate`, id);
  }

  sendPdf(id: string): Observable<any> {
    return this.http.post(`${this.apiBaseUrl}/v1/acquisition/${id}/purchaseOrder/send`, id);
  }

  updateAcquisition(id: string, request: any): Observable<any> {
    return this.http.put(`${this.apiBaseUrl}/v1/acquisition/${id}`, request);
  }

  updateAcquisitionStatus(id: string, request: any): Observable<any> {
    return this.http.put(`${this.apiBaseUrl}/v1/acquisition/${id}/status`, request);
  }

  deleteAcquisition(id: string): Observable<any> {
    return this.http.delete(`${this.apiBaseUrl}/v1/acquisition/${id}`);
  }
}
