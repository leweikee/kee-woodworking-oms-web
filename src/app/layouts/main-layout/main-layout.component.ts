import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { filter, interval, Subject, takeUntil } from 'rxjs';
import dayjs from 'dayjs';
import { AuthService } from '../../core/auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterLink, RouterOutlet, NzIconModule, NzLayoutModule, NzMenuModule, NzDropDownModule, NzAvatarModule, NzButtonModule, NzDividerModule, CommonModule],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  public isCollapsed = true;
  public title = 'kee_woodworking';
  public formattedDate: any;
  public openMap: Record<string, boolean> = {
    sub1: false,
    sub2: false,
    sub3: false,
    sub4: false,
    sub5: false
  };

  public username: any;
  public isAdmin: any;
  public isInventory: any;

  private destroy$ = new Subject<void>();
  private currentUser: any;
  private currentRoute: any;

  constructor(private authService: AuthService, private router: Router) {
    this.currentUser = this.authService.currentUserValue;
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute = event.urlAfterRedirects || event.url;
      });
  }

  ngOnInit() {
    this.isAdmin = this.currentUser.roles.includes('Admin');
    this.isInventory = this.currentUser.roles.includes('Inventory');
    this.username = this.currentUser.userName;
    this.updateTime();
    interval(60000).pipe(takeUntil(this.destroy$)).subscribe(() => this.updateTime())
  }

  updateTime() {
    this.formattedDate = dayjs().format('D/M/YYYY, h:mm A');
  }

  openHandler(value: string) {
    for (const key in this.openMap) {
      if (key !== value) {
        this.openMap[key] = false;
      }
    }
  }

  isProfileActive(): boolean {
    return this.currentRoute.startsWith('/profile');
  }

  openProfile() {
    this.router.navigate(['/profile']);
  }

  logout() {
    this.authService.logout();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
