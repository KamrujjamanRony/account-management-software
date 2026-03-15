import { TestBed } from '@angular/core/testing';

import { FixedAssetService } from './fixed-asset.service';

describe('FixedAssetService', () => {
  let service: FixedAssetService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FixedAssetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
