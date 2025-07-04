import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OutboundFormComponent } from './outbound-form.component';

describe('OutboundFormComponent', () => {
  let component: OutboundFormComponent;
  let fixture: ComponentFixture<OutboundFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OutboundFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OutboundFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
