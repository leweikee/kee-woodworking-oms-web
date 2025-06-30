import { Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { InboundListingComponent } from "./inbound-management/inbound-listing/inbound-listing.component";
import { OutboundListingComponent } from "./outbound-management/outbound-listing/outbound-listing.component";

@Component({
  selector: 'app-movements-management',
  standalone: true,
  imports: [
    NzTabsModule, CommonModule,
    InboundListingComponent,
    OutboundListingComponent
],
  templateUrl: './movements-management.component.html',
  styleUrl: './movements-management.component.scss'
})
export class MovementsManagementComponent {
  selectedTabIndex = 0;
}
