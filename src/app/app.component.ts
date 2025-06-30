import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { interval, Subject, takeUntil } from 'rxjs';
import dayjs from 'dayjs';

@Component({
  selector: 'app-root',
  imports: [ RouterOutlet, NzIconModule, NzLayoutModule, NzMenuModule, NzDropDownModule, NzAvatarModule, NzButtonModule, NzDividerModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  public isCollapsed = false;
  public title = 'kee_woodworking';
  public formattedDate: any;
  public openMap: Record<string, boolean> = {
    sub1: false,
    sub2: false,
    sub3: false,
    sub4: false,
    sub5: false
  };

  private destroy$ = new Subject<void>();

  constructor() { }

  ngOnInit() {
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

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
