import { Routes } from '@angular/router';
import { ReceiveVoucherComponent } from './accounts/pages/entry/receive-voucher/receive-voucher.component';
import { TransactionsComponent } from './accounts/pages/reports/transactions/transactions.component';
import { MainComponent } from './layouts/main/main.component';
import { AccountComponent } from './layouts/account/account.component';
import { UsersComponent } from './users/pages/users/users.component';
import { DashboardComponent } from './accounts/pages/dashboard/dashboard.component';
import { VendorEntryComponent } from './accounts/pages/setup/vendor-entry/vendor-entry.component';
import { AccountListEntryComponent } from './accounts/pages/setup/account-list-entry/account-list-entry.component';
import { ExpenseVoucherComponent } from './accounts/pages/entry/expense-voucher/expense-voucher.component';
import { JournalVoucherComponent } from './accounts/pages/entry/journal-voucher/journal-voucher.component';
import { ReceiptPaymentComponent } from './accounts/pages/reports/receipt-payment/receipt-payment.component';
import { TrialBalanceComponent } from './accounts/pages/reports/trial-balance/trial-balance.component';
import { GeneralLedgerComponent } from './accounts/pages/reports/general-ledger/general-ledger.component';
import { GeneralCashBookComponent } from './accounts/pages/reports/general-cash-book/general-cash-book.component';
import { IncomeExpenseStatementComponent } from './accounts/pages/reports/income-expense-statement/income-expense-statement.component';
import { BankEntryComponent } from './accounts/pages/setup/bank-entry/bank-entry.component';

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
            component: DashboardComponent
          },
          {
            path: 'setup/bank',
            component: BankEntryComponent
          },
          {
            path: 'setup/vendor',
            component: VendorEntryComponent
          },
          {
            path: 'setup/account-chart',
            component: AccountListEntryComponent
          },
          {
            path: 'entry/payment-voucher',
            component: ExpenseVoucherComponent
          },
          {
            path: 'entry/receive-voucher',
            component: ReceiveVoucherComponent
          },
          {
            path: 'entry/journal-voucher',
            component: JournalVoucherComponent
          },
          {
            path: 'reports/receipt-payment',
            component: ReceiptPaymentComponent
          },
          {
            path: 'reports/trial-balance',
            component: TrialBalanceComponent
          },
          {
            path: 'reports/general-ledger',
            component: GeneralLedgerComponent
          },
          {
            path: 'reports/general-cashbook',
            component: GeneralCashBookComponent
          },
          {
            path: 'reports/transactions',
            component: TransactionsComponent
          },
          {
            path: 'reports/income-expense-statement',
            component: IncomeExpenseStatementComponent
          },
        ],
      },
      {
        path: 'user-access',
        component: UsersComponent
      },
    ],
  }
];
