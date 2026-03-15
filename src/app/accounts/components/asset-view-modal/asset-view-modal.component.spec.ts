import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetViewModalComponent } from './asset-view-modal.component';

describe('AssetViewModalComponent', () => {
  let component: AssetViewModalComponent;
  let fixture: ComponentFixture<AssetViewModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetViewModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetViewModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
