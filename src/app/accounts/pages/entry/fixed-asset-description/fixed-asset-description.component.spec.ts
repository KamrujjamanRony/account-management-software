import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FixedAssetDescriptionComponent } from './fixed-asset-description.component';

describe('FixedAssetDescriptionComponent', () => {
  let component: FixedAssetDescriptionComponent;
  let fixture: ComponentFixture<FixedAssetDescriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FixedAssetDescriptionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FixedAssetDescriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
