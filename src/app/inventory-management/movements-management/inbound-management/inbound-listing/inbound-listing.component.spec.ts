import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InboundListingComponent } from './inbound-listing.component';

describe('InboundListingComponent', () => {
  let component: InboundListingComponent;
  let fixture: ComponentFixture<InboundListingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InboundListingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InboundListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
