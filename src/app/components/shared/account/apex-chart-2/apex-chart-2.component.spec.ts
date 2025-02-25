import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApexChart2Component } from './apex-chart-2.component';

describe('ApexChart2Component', () => {
  let component: ApexChart2Component;
  let fixture: ComponentFixture<ApexChart2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApexChart2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApexChart2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
