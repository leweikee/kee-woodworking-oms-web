import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcquisitionListingComponent } from './acquisition-listing.component';

describe('AcquisitionListingComponent', () => {
  let component: AcquisitionListingComponent;
  let fixture: ComponentFixture<AcquisitionListingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcquisitionListingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AcquisitionListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
