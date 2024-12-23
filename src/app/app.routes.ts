import { Routes } from '@angular/router';
import { MainComponent } from './components/layouts/main/main.component';
import { DoctorFeeComponent } from './components/pages/setup/doctor/doctor-fee/doctor-fee.component';
import { DoctorFeeReportComponent } from './components/pages/reports/doctor-fee-report/doctor-fee-report.component';
import { DoctorsReportComponent } from './components/pages/reports/doctors-report/doctors-report.component';
import { BankEntryComponent } from './components/pages/accounts/setup/bank-entry/bank-entry.component';
import { VendorEntryComponent } from './components/pages/accounts/setup/vendor-entry/vendor-entry.component';
import { AccountListEntryComponent } from './components/pages/accounts/setup/account-list-entry/account-list-entry.component';
import { VoucherEntryComponent } from './components/pages/accounts/setup/voucher-entry/voucher-entry.component';

export const routes: Routes = [
    {
        path: '',
        component: MainComponent,
        children: [
          { path: '', redirectTo: 'home', pathMatch: 'full' },
          {
            path: '',
            component: BankEntryComponent
          },
          {
            path: 'setup/bank-entry',
            component: BankEntryComponent
          },
          {
            path: 'setup/vendor-entry',
            component: VendorEntryComponent
          },
          {
            path: 'setup/account-list-entry',
            component: AccountListEntryComponent
          },
          {
            path: 'setup/voucher-entry',
            component: VoucherEntryComponent
          },
          {
            path: 'setup/doctor/fee',
            component: DoctorFeeComponent
          },
          {
            path: 'reports/doctor-fee-report',
            component: DoctorFeeReportComponent
          },
          {
            path: 'reports/doctors-report',
            component: DoctorsReportComponent
          },
        ],
      }
];
