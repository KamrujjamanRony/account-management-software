import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OutdoorSidebarComponent } from './outdoor-sidebar.component';

describe('OutdoorSidebarComponent', () => {
  let component: OutdoorSidebarComponent;
  let fixture: ComponentFixture<OutdoorSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OutdoorSidebarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OutdoorSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
