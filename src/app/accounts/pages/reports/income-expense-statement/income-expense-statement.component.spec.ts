import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncomeExpenseStatementComponent } from './income-expense-statement.component';

describe('IncomeExpenseStatementComponent', () => {
  let component: IncomeExpenseStatementComponent;
  let fixture: ComponentFixture<IncomeExpenseStatementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncomeExpenseStatementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IncomeExpenseStatementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
