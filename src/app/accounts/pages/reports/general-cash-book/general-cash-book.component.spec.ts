import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneralCashBookComponent } from './general-cash-book.component';

describe('GeneralCashBookComponent', () => {
  let component: GeneralCashBookComponent;
  let fixture: ComponentFixture<GeneralCashBookComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeneralCashBookComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeneralCashBookComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
