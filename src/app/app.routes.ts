import { Routes } from '@angular/router';
import { MainComponent } from './layouts/main/main.component';
import { AccountComponent } from './layouts/account/account.component';

export const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [
      { path: '', redirectTo: 'accounts', pathMatch: 'full' },
      {
        path: 'accounts',
        component: AccountComponent,
        children: [
          { path: '', redirectTo: '', pathMatch: 'full' },
          {
            path: '',
            loadComponent: () =>
              import('./accounts/pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
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
        path: 'user-access',
        loadComponent: () =>
          import('./users/pages/users/users.component').then(m => m.UsersComponent),
        data: { preload: true },
      },
    ],
  }
];
