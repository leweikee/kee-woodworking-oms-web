import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
    private apiBaseUrl = environment.apiBaseUrl

  constructor(private http: HttpClient) {}

  resetPassword(request: any): Observable<any> {
    return this.http.post(`${this.apiBaseUrl}/account/reset-password`, request);
  }

  getAllUsers(request: any): Observable<any> {
    let params = new HttpParams()
      .set('PageNumber', request.PageNumber)
      .set('PageSize', request.PageSize)
      .set('Search', request.Search)
      .set('Role', request.Role);
    return this.http.get(`${this.apiBaseUrl}/v1/user`, { params });
  }

  getUserById(id: string): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/v1/user/${id}`);
  }

  createUser(request: any): Observable<any> {
    return this.http.post(`${this.apiBaseUrl}/v1/user`, request);
  }

  updateUser(id: string, request: any): Observable<any> {
    return this.http.put(`${this.apiBaseUrl}/v1/user/${id}`, request);
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.apiBaseUrl}/v1/user/${id}`);
  }

  reactivateUser(id: string, request: any): Observable<any> {
    return this.http.post(`${this.apiBaseUrl}/v1/user/${id}/activate`, request);
  }
}
