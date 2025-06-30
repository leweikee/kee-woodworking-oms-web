import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Add auth header with jwt if user is logged in
  const token = authService.token;
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Auto logout if 401 Unauthorized or 403 Forbidden responses
      if ([401, 403].includes(error.status) && authService.currentUserValue) {
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};