import { TestBed } from '@angular/core/testing';

import { AccountingReportsService } from './accounting-reports.service';

describe('AccountingReportsService', () => {
  let service: AccountingReportsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AccountingReportsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
