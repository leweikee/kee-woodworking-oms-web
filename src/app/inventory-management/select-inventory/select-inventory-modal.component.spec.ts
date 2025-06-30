import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectInventoryModalComponent } from './select-inventory-modal.component';

describe('SelectInventoryModalComponent', () => {
  let component: SelectInventoryModalComponent;
  let fixture: ComponentFixture<SelectInventoryModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectInventoryModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectInventoryModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
