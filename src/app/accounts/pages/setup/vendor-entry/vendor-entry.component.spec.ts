import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorEntryComponent } from './vendor-entry.component';

describe('VendorEntryComponent', () => {
  let component: VendorEntryComponent;
  let fixture: ComponentFixture<VendorEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VendorEntryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VendorEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
