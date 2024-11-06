import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncomeEntryComponent } from './income-entry.component';

describe('IncomeEntryComponent', () => {
  let component: IncomeEntryComponent;
  let fixture: ComponentFixture<IncomeEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncomeEntryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IncomeEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
