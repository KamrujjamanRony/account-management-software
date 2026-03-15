import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OutdoorBillComponent } from './outdoor-bill.component';

describe('OutdoorBillComponent', () => {
  let component: OutdoorBillComponent;
  let fixture: ComponentFixture<OutdoorBillComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OutdoorBillComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OutdoorBillComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
