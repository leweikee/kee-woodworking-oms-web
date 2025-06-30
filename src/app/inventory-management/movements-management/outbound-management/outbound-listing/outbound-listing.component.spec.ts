import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OutboundListingComponent } from './outbound-listing.component';

describe('OutboundListingComponent', () => {
  let component: OutboundListingComponent;
  let fixture: ComponentFixture<OutboundListingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OutboundListingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OutboundListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
