import { Routes } from '@angular/router';
import { MainComponent } from './layouts/main/main.component';
import { AccountComponent } from './layouts/account/account.component';
import { HrLayoutComponent } from './layouts/hr-layout/hr-layout.component';
import { DoctorFeeLayoutComponent } from './layouts/doctor-fee-layout/doctor-fee-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () => import('./home/home.component').then(m => m.HomeComponent),
        data: { preload: true },
      },
      {
        path: 'accounts',
        component: AccountComponent,
        children: [
          { path: '', redirectTo: '', pathMatch: 'full' },
          {
            path: '',
            loadComponent: () =>
              import('./accounts/pages/account-dashboard/account-dashboard.component').then(m => m.AccountDashboardComponent),
            data: { preload: false },
          },
          {
            path: 'setup/bank',
            loadComponent: () =>
              import('./accounts/pages/setup/bank-entry/bank-entry.component').then(m => m.BankEntryComponent),
            data: { preload: false },
          },
          {
            path: 'setup/vendor',
            loadComponent: () =>
              import('./accounts/pages/setup/vendor-entry/vendor-entry.component').then(m => m.VendorEntryComponent),
            data: { preload: false },
          },
          {
            path: 'setup/account-chart',
            loadComponent: () =>
              import('./accounts/pages/setup/account-list-entry/account-list-entry.component').then(m => m.AccountListEntryComponent),
            data: { preload: false },
          },
          {
            path: 'entry/payment-voucher',
            loadComponent: () =>
              import('./accounts/pages/entry/expense-voucher/expense-voucher.component').then(m => m.ExpenseVoucherComponent),
            data: { preload: false },
          },
          {
            path: 'entry/receive-voucher',
            loadComponent: () =>
              import('./accounts/pages/entry/receive-voucher/receive-voucher.component').then(m => m.ReceiveVoucherComponent),
            data: { preload: false },
          },
          {
            path: 'entry/journal-voucher',
            loadComponent: () =>
              import('./accounts/pages/entry/journal-voucher/journal-voucher.component').then(m => m.JournalVoucherComponent),
            data: { preload: false },
          },
          {
            path: 'reports/receipt-payment',
            loadComponent: () =>
              import('./accounts/pages/reports/receipt-payment/receipt-payment.component').then(m => m.ReceiptPaymentComponent),
            data: { preload: false },
          },
          {
            path: 'reports/trial-balance',
            loadComponent: () =>
              import('./accounts/pages/reports/trial-balance/trial-balance.component').then(m => m.TrialBalanceComponent),
            data: { preload: false },
          },
          {
            path: 'reports/general-ledger',
            loadComponent: () =>
              import('./accounts/pages/reports/general-ledger/general-ledger.component').then(m => m.GeneralLedgerComponent),
            data: { preload: false },
          },
          {
            path: 'reports/general-cashbook',
            loadComponent: () =>
              import('./accounts/pages/reports/general-cash-book/general-cash-book.component').then(m => m.GeneralCashBookComponent),
            data: { preload: false },
          },
          {
            path: 'reports/transactions',
            loadComponent: () =>
              import('./accounts/pages/reports/transactions/transactions.component').then(m => m.TransactionsComponent),
            data: { preload: false },
          },
          {
            path: 'reports/income-expense-statement',
            loadComponent: () =>
              import('./accounts/pages/reports/income-expense-statement/income-expense-statement.component').then(m => m.IncomeExpenseStatementComponent),
            data: { preload: false },
          },
        ],
      },
      {
        path: 'hr',
        component: HrLayoutComponent,
        children: [
          { path: '', redirectTo: '', pathMatch: 'full' },
          {
            path: '',
            loadComponent: () =>
              import('./hr/pages/hr-dashboard/hr-dashboard.component').then(m => m.HrDashboardComponent),
            data: { preload: false },
          },
          {
            path: 'entry/employee',
            loadComponent: () =>
              import('./hr/pages/entry/employee/employee.component').then(m => m.EmployeeComponent),
            data: { preload: false },
          },
        ],
      },
      {
        path: 'doctor-fee',
        component: DoctorFeeLayoutComponent,
        children: [
          { path: '', redirectTo: '', pathMatch: 'full' },
          {
            path: '',
            loadComponent: () =>
              import('./doctor-fee/pages/registration/registration.component').then(m => m.RegistrationComponent),
            data: { preload: false },
          },
          {
            path: 'registration',
            loadComponent: () =>
              import('./doctor-fee/pages/registration/registration.component').then(m => m.RegistrationComponent),
            data: { preload: false },
          },
          {
            path: 'setup/doctor/entry',
            loadComponent: () =>
              import('./doctor-fee/pages/setup/doctor/doctor-entry/doctor-entry.component').then(m => m.DoctorEntryComponent),
            data: { preload: false },
          },
          {
            path: 'setup/doctor/fee',
            loadComponent: () =>
              import('./doctor-fee/pages/setup/doctor/doctor-fee/doctor-fee.component').then(m => m.DoctorFeeComponent),
            data: { preload: false },
          },
          {
            path: 'reports/doctor-fee-report',
            loadComponent: () =>
              import('./doctor-fee/pages/reports/doctor-fee-report/doctor-fee-report.component').then(m => m.DoctorFeeReportComponent),
            data: { preload: false },
          },
          {
            path: 'reports/doctors-report',
            loadComponent: () =>
              import('./doctor-fee/pages/reports/doctors-report/doctors-report.component').then(m => m.DoctorsReportComponent),
            data: { preload: false },
          },
        ],
      },
      {
        path: 'user-access',
        loadComponent: () =>
          import('./users/pages/users/users.component').then(m => m.UsersComponent),
        data: { preload: false },
      },
    ],
  }
];
