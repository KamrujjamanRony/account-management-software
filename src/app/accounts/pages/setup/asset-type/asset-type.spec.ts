import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetType } from './asset-type';

describe('AssetType', () => {
  let component: AssetType;
  let fixture: ComponentFixture<AssetType>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetType]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetType);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
