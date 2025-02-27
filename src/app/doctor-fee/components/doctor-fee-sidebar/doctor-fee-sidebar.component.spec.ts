import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorFeeSidebarComponent } from './doctor-fee-sidebar.component';

describe('DoctorFeeSidebarComponent', () => {
  let component: DoctorFeeSidebarComponent;
  let fixture: ComponentFixture<DoctorFeeSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorFeeSidebarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DoctorFeeSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
