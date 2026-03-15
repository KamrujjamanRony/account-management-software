import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorFeeLayoutComponent } from './doctor-fee-layout.component';

describe('DoctorFeeLayoutComponent', () => {
  let component: DoctorFeeLayoutComponent;
  let fixture: ComponentFixture<DoctorFeeLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorFeeLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DoctorFeeLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
