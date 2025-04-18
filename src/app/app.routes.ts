import { Routes } from '@angular/router';
import { MainComponent } from './layouts/main/main.component';
import { AccountComponent } from './layouts/account/account.component';
import { HrLayoutComponent } from './layouts/hr-layout/hr-layout.component';
import { DoctorFeeLayoutComponent } from './layouts/doctor-fee-layout/doctor-fee-layout.component';
import { SettingsLayoutComponent } from './layouts/settings-layout/settings-layout.component';
import { authGuard } from './settings/services/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: MainComponent, canActivate: [authGuard],
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
            data: { preload: true },
          },
          {
            path: 'setup/bank',
            loadComponent: () =>
              import('./accounts/pages/setup/bank-entry/bank-entry.component').then(m => m.BankEntryComponent),
            data: { preload: true },
          },
          {
            path: 'setup/vendor',
            loadComponent: () =>
              import('./accounts/pages/setup/vendor-entry/vendor-entry.component').then(m => m.VendorEntryComponent),
            data: { preload: true },
          },
          {
            path: 'setup/account-chart',
            loadComponent: () =>
              import('./accounts/pages/setup/account-list-entry/account-list-entry.component').then(m => m.AccountListEntryComponent),
            data: { preload: true },
          },
          {
            path: 'entry/payment-voucher',
            loadComponent: () =>
              import('./accounts/pages/entry/expense-voucher/expense-voucher.component').then(m => m.ExpenseVoucherComponent),
            data: { preload: true },
          },
          {
            path: 'entry/receive-voucher',
            loadComponent: () =>
              import('./accounts/pages/entry/receive-voucher/receive-voucher.component').then(m => m.ReceiveVoucherComponent),
            data: { preload: true },
          },
          {
            path: 'entry/journal-voucher',
            loadComponent: () =>
              import('./accounts/pages/entry/journal-voucher/journal-voucher.component').then(m => m.JournalVoucherComponent),
            data: { preload: true },
          },
          {
            path: 'entry/fixed-asset-description',
            loadComponent: () =>
              import('./accounts/pages/entry/fixed-asset-description/fixed-asset-description.component').then(m => m.FixedAssetDescriptionComponent),
            data: { preload: true },
          },
          {
            path: 'reports/receipt-payment',
            loadComponent: () =>
              import('./accounts/pages/reports/receipt-payment/receipt-payment.component').then(m => m.ReceiptPaymentComponent),
            data: { preload: true },
          },
          {
            path: 'reports/trial-balance',
            loadComponent: () =>
              import('./accounts/pages/reports/trial-balance/trial-balance.component').then(m => m.TrialBalanceComponent),
            data: { preload: true },
          },
          {
            path: 'reports/general-ledger',
            loadComponent: () =>
              import('./accounts/pages/reports/general-ledger/general-ledger.component').then(m => m.GeneralLedgerComponent),
            data: { preload: true },
          },
          {
            path: 'reports/general-cashbook',
            loadComponent: () =>
              import('./accounts/pages/reports/general-cash-book/general-cash-book.component').then(m => m.GeneralCashBookComponent),
            data: { preload: true },
          },
          {
            path: 'reports/transactions',
            loadComponent: () =>
              import('./accounts/pages/reports/transactions/transactions.component').then(m => m.TransactionsComponent),
            data: { preload: true },
          },
          {
            path: 'reports/income-expense-statement',
            loadComponent: () =>
              import('./accounts/pages/reports/income-expense-statement/income-expense-statement.component').then(m => m.IncomeExpenseStatementComponent),
            data: { preload: true },
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
            data: { preload: true },
          },
          {
            path: 'entry/employee',
            loadComponent: () =>
              import('./hr/pages/entry/employee/employee.component').then(m => m.EmployeeComponent),
            data: { preload: true },
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
            data: { preload: true },
          },
          {
            path: 'registration',
            loadComponent: () =>
              import('./doctor-fee/pages/registration/registration.component').then(m => m.RegistrationComponent),
            data: { preload: true },
          },
          {
            path: 'setup/doctor/entry',
            loadComponent: () =>
              import('./doctor-fee/pages/setup/doctor/doctor-entry/doctor-entry.component').then(m => m.DoctorEntryComponent),
            data: { preload: true },
          },
          {
            path: 'setup/doctor/fee',
            loadComponent: () =>
              import('./doctor-fee/pages/setup/doctor/doctor-fee/doctor-fee.component').then(m => m.DoctorFeeComponent),
            data: { preload: true },
          },
          {
            path: 'reports/doctor-fee-report',
            loadComponent: () =>
              import('./doctor-fee/pages/reports/doctor-fee-report/doctor-fee-report.component').then(m => m.DoctorFeeReportComponent),
            data: { preload: true },
          },
          {
            path: 'reports/doctors-report',
            loadComponent: () =>
              import('./doctor-fee/pages/reports/doctors-report/doctors-report.component').then(m => m.DoctorsReportComponent),
            data: { preload: true },
          },
        ],
      },
      {
        path: 'settings',
        component: SettingsLayoutComponent,
        children: [
          { path: '', redirectTo: 'user', pathMatch: 'full' },
          {
            path: 'user',
            loadComponent: () =>
              import('./settings/pages/users/users.component').then(m => m.UsersComponent),
            data: { preload: true },
          },
          {
            path: 'menu',
            loadComponent: () =>
              import('./settings/pages/menu-list/menu-list.component').then(m => m.MenuListComponent),
            data: { preload: true },
          },
        ],
      },
    ],
  },
  {
    path: 'login',
    loadComponent: () => import('./settings/pages/login/login.component').then(m => m.LoginComponent),
    data: { preload: true },
  },
];
