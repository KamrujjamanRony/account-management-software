import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoucherEntryComponent } from './voucher-entry.component';

describe('VoucherEntryComponent', () => {
  let component: VoucherEntryComponent;
  let fixture: ComponentFixture<VoucherEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoucherEntryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VoucherEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
