import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Selector2Component } from './selector2.component';

describe('Selector2Component', () => {
  let component: Selector2Component;
  let fixture: ComponentFixture<Selector2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Selector2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Selector2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
