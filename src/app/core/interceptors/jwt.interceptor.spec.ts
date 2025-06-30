// src/app/core/interceptors/jwt.interceptor.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpHandlerFn, HttpInterceptorFn } from '@angular/common/http';
import { jwtInterceptor } from './jwt.interceptor';
import { AuthService } from '../auth/auth.service';
import { of } from 'rxjs';

describe('jwtInterceptor', () => {
  let authServiceMock: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    // Create spy for AuthService methods and properties
    authServiceMock = jasmine.createSpyObj('AuthService', ['logout'], {
      get token() { return null; },
      get currentUserValue() { return null; }
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock }
      ]
    });
  });

  it('should add an Authorization header when a token is available', () => {
    // Setup mock token
    Object.defineProperty(authServiceMock, 'token', {
      get: () => 'fake-jwt-token'
    });
    
    // Create request and next handler
    const request = new HttpRequest('GET', '/api/test');
    const next: jasmine.Spy<HttpHandlerFn> = jasmine.createSpy().and.returnValue(of({}));
    
    // Get the interceptor from TestBed
    TestBed.runInInjectionContext(() => {
      // Call the interceptor
      jwtInterceptor(request, next);
      
      // Verify next was called with a request containing the auth header
      expect(next).toHaveBeenCalled();
      const modifiedRequest = next.calls.mostRecent().args[0] as HttpRequest<any>;
      expect(modifiedRequest.headers.get('Authorization')).toBe('Bearer fake-jwt-token');
    });
  });
  
  it('should not add an Authorization header when no token is available', () => {
    // Ensure token returns null
    Object.defineProperty(authServiceMock, 'token', {
      get: () => null
    });
    
    // Create request and next handler
    const request = new HttpRequest('GET', '/api/test');
    const next: jasmine.Spy<HttpHandlerFn> = jasmine.createSpy().and.returnValue(of({}));
    
    // Get the interceptor from TestBed
    TestBed.runInInjectionContext(() => {
      // Call the interceptor
      jwtInterceptor(request, next);
      
      // Verify the request was passed through unchanged
      expect(next).toHaveBeenCalledWith(request);
    });
  });

  it('should logout the user on 401 unauthorized response', () => {
    // Setup mock token and currentUserValue
    Object.defineProperty(authServiceMock, 'token', {
      get: () => 'fake-jwt-token'
    });
    Object.defineProperty(authServiceMock, 'currentUserValue', {
      get: () => ({ username: 'test' })
    });
    
    // Create request and next handler that returns a 401 error
    const request = new HttpRequest('GET', '/api/test');
    const mockError = { status: 401 };
    const next: jasmine.Spy<HttpHandlerFn> = jasmine.createSpy().and.returnValue(
      of({}).pipe(() => {
        throw mockError;
      })
    );
    
    // Get the interceptor from TestBed
    TestBed.runInInjectionContext(() => {
      // Call the interceptor
      const result = jwtInterceptor(request, next);
      
      // Subscribe to trigger the error handler
      result.subscribe({
        error: (err) => {
          expect(err).toBe(mockError);
          expect(authServiceMock.logout).toHaveBeenCalled();
        }
      });
    });
  });
});