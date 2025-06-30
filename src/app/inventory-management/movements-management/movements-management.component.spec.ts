import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MovementsManagementComponent } from './movements-management.component';

describe('MovementsManagementComponent', () => {
  let component: MovementsManagementComponent;
  let fixture: ComponentFixture<MovementsManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovementsManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MovementsManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
