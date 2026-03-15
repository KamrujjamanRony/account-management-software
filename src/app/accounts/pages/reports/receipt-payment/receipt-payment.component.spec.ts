import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceiptPaymentComponent } from './receipt-payment.component';

describe('ReceiptPaymentComponent', () => {
  let component: ReceiptPaymentComponent;
  let fixture: ComponentFixture<ReceiptPaymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceiptPaymentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReceiptPaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
