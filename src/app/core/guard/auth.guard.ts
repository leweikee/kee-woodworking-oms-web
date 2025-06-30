import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const user = this.authService.currentUserValue;
    const expectedRoles = route.data['roles'] as string[];

    if (!user) {
      // Not logged in
      this.router.navigate(['/login']);
      return false;
    }

    if (expectedRoles && expectedRoles.length > 0) {
      const hasRole = expectedRoles.some(role => user.roles.includes(role));
      if (!hasRole) {
        // Logged in but wrong role => Redirect to profile
        this.router.navigate(['/profile']);
        return false;
      }
    }

    return true;
  }
}
