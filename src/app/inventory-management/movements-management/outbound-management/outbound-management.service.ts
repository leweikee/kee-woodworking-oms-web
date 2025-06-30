import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class OutboundManagementService {
  private apiBaseUrl = environment.apiBaseUrl

  constructor(private http: HttpClient) {}

  getAllOutbounds(request: any): Observable<any> {
    let params = new HttpParams()
      .set('PageNumber', request.PageNumber)
      .set('PageSize', request.PageSize)
      .set('Search', request.Search)
      .set('Category', request.Category);
    return this.http.get(`${this.apiBaseUrl}/v1/outbound`, { params });
  }

  createOutboundBatch(request: any): Observable<any> {
    return this.http.post(`${this.apiBaseUrl}/v1/outbound/batch`, request);
  }

  reverseOutbound(id: string, request: any): Observable<any> {
    return this.http.post(`${this.apiBaseUrl}/v1/outbound/${id}/reverse`, request);
  }
}
