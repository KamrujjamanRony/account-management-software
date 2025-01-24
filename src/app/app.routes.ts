import { Routes } from '@angular/router';
import { MainComponent } from './components/layouts/main/main.component';
import { BankEntryComponent } from './components/pages/accounts/setup/bank-entry/bank-entry.component';
import { VendorEntryComponent } from './components/pages/accounts/setup/vendor-entry/vendor-entry.component';
import { AccountListEntryComponent } from './components/pages/accounts/setup/account-list-entry/account-list-entry.component';
import { ExpenseVoucherComponent } from './components/pages/accounts/entry/expense-voucher/expense-voucher.component';
import { ReceiveVoucherComponent } from './components/pages/accounts/entry/receive-voucher/receive-voucher.component';
import { JournalVoucherComponent } from './components/pages/accounts/entry/journal-voucher/journal-voucher.component';
import { ReceiptPaymentComponent } from './components/pages/accounts/reports/receipt-payment/receipt-payment.component';
import { TrialBalanceComponent } from './components/pages/accounts/reports/trial-balance/trial-balance.component';
import { GeneralLedgerComponent } from './components/pages/accounts/reports/general-ledger/general-ledger.component';
import { GeneralCashBookComponent } from './components/pages/accounts/reports/general-cash-book/general-cash-book.component';
import { TransactionsComponent } from './components/pages/accounts/reports/transactions/transactions.component';
import { UsersComponent } from './components/pages/users/users.component';

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
        path: 'user-access',
        component: UsersComponent
      },
    ],
  }
];
