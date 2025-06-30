import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcquisitionFormComponent } from './acquisiton-form.component';

describe('AcquisitionFormComponent', () => {
  let component: AcquisitionFormComponent;
  let fixture: ComponentFixture<AcquisitionFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcquisitionFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AcquisitionFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
