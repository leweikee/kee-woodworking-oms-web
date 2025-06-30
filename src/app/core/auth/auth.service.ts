// src/app/core/auth/auth.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../environment/environment';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';

// Models
export interface AuthResponse {
  succeeded: boolean;
  message: string | null;
  errors: string[] | null;
  data: {
    id: string;                   // GUID format
    userName: string;
    email: string;                // Changed from emailAddress to match response
    isFirstLogin: boolean;
    roles: string[];
    isVerified: boolean;
    jwToken: string;              // Changed from token to match response
    // Add other fields from response if needed
  };
}

// Optional: You might want a separate User interface for the data portion
export interface User {
  id: string;
  userName: string;
  email: string;
  isFirstLogin: boolean;
  roles: string[];
  isVerified: boolean;
  token: string;                  // You can keep this as token in your frontend model
  tokenExpiry?: number;           // Added from your existing code
}

interface DecodedToken {
  exp: number;
  sub?: string;
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private tokenExpirationTimer: any;

  // Signal-based approach for current user state
  private currentUserState = signal<User | null>(this.getStoredUser());
  readonly currentUser$ = toObservable(this.currentUserState);

  constructor() {
    if (this.currentUserState()?.token) {
      if (this.isTokenExpired()) {
        this.logout();
      } else {
        this.startTokenTimer();
      }
    }
  }

  // Public methods
  public get currentUserValue(): User | null {
    return this.currentUserState();
  }

  public get token(): string | null {
    return this.currentUserValue?.token || null;
  }

  login(request: any): Observable<User> {
    return this.http.post<AuthResponse>(`${environment.apiBaseUrl}/account/authenticate`, request)
      .pipe(
        map(response => {
          if (!response.succeeded || !response.data) {
            throw new Error(response.message || 'Authentication failed');
          }
          return response.data;
        }),
        switchMap(data => this.handleAuthResponse(data)),
        catchError(error => {
          this.clearUser();
          return throwError(() => this.normalizeError(error));
        })
      );
  }
  
  logout(): void {
    this.clearUser();
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!(this.currentUserValue?.token && !this.isTokenExpired());
  }

  isFirstLogin(): boolean {
    return this.currentUserValue?.isFirstLogin === true;
  }

  // Private methods
  private handleAuthResponse(data: any): Observable<User> {
    if (!data?.jwToken) {
      throw new Error('Invalid server response: Missing token');
    }
  
    const decoded = this.decodeToken(data.jwToken);
    if (!decoded?.exp) {
      throw new Error('Invalid token format');
    }
  
    const user: User = {
      ...data,
      token: data.jwToken,
      tokenExpiry: decoded.exp
    };
  
    this.storeUser(user);
    this.startTokenTimer();
    return of(user);
  }

  private getStoredUser(): User | null {
    try {
      const userData = localStorage.getItem('currentUser');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  private storeUser(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserState.set(user);
  }

  private clearUser(): void {
    localStorage.removeItem('currentUser');
    this.currentUserState.set(null);
    this.stopTokenTimer();
  }

  private decodeToken(token: string): DecodedToken {
    try {
      return jwtDecode<DecodedToken>(token);
    } catch {
      throw new Error('Invalid token');
    }
  }

  private isTokenExpired(): boolean {
    const user = this.currentUserValue;
    if (!user?.tokenExpiry) return true;
    
    // Consider token expired 30 seconds before actual expiry
    const now = Math.floor(Date.now() / 1000);
    return user.tokenExpiry - 30 < now;
  }

  private startTokenTimer(): void {
    const user = this.currentUserValue;
    if (!user?.tokenExpiry) return;

    this.stopTokenTimer();
    
    // Logout 30 seconds before token expiration
    const expiresIn = (user.tokenExpiry * 1000) - Date.now() - 30000;
    if (expiresIn <= 0) {
      this.logout();
      return;
    }
    
    this.tokenExpirationTimer = setTimeout(() => {
      this.logout();
    }, expiresIn);
  }

  private stopTokenTimer(): void {
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }
  }

  private normalizeError(error: any): Error {
    if (error?.error?.message) return new Error(error.error.message);
    if (error?.message) return new Error(error.message);
    return new Error('Authentication failed');
  }
}