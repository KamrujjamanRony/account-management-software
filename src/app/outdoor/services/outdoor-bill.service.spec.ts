import { TestBed } from '@angular/core/testing';

import { OutdoorBillService } from './outdoor-bill.service';

describe('OutdoorBillService', () => {
  let service: OutdoorBillService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OutdoorBillService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
