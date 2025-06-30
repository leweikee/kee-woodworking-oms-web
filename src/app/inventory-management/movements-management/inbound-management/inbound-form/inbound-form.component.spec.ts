import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InboundFormComponent } from './inbound-form.component';

describe('InboundFormComponent', () => {
  let component: InboundFormComponent;
  let fixture: ComponentFixture<InboundFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InboundFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InboundFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
