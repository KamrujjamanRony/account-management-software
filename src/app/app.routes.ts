import { Routes } from '@angular/router';
import { MainComponent } from './components/layouts/main/main.component';
import { BankEntryComponent } from './components/pages/accounts/setup/bank-entry/bank-entry.component';
import { VendorEntryComponent } from './components/pages/accounts/setup/vendor-entry/vendor-entry.component';
import { AccountListEntryComponent } from './components/pages/accounts/setup/account-list-entry/account-list-entry.component';
import { ExpenseVoucherComponent } from './components/pages/accounts/setup/expense-voucher/expense-voucher.component';
import { ReceiveVoucherComponent } from './components/pages/accounts/setup/receive-voucher/receive-voucher.component';
import { JournalVoucherComponent } from './components/pages/accounts/setup/journal-voucher/journal-voucher.component';

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
        path: 'setup/payment-voucher',
        component: ExpenseVoucherComponent
      },
      {
        path: 'setup/receive-voucher',
        component: ReceiveVoucherComponent
      },
      {
        path: 'setup/journal-voucher',
        component: JournalVoucherComponent
      },
    ],
  }
];
