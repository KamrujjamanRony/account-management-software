import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AllSvgComponent } from "../svg/all-svg/all-svg.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, AllSvgComponent, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {



  sidebarData = signal<any[]>([
    // {
    //   id: 0, label: 'Dashboard', icon: 'settings', route: '/'    // ToDo: comment remove
    // },
    {
      id: 1, label: 'Setup', icon: 'reports', menu: [
        {
          id: 11, label: 'Bank Setup', route: '/setup/bank'
        },
        {
          id: 12, label: 'Vendor Setup', route: '/setup/vendor'
        },
        {
          id: 13, label: 'Chart Of Account', route: '/setup/account-chart'
        }
      ]
    },
    {
      id: 2, label: 'Entry', icon: 'expense-entry', menu: [
        {
          id: 21, label: 'Payment Voucher', route: '/entry/payment-voucher'
        },
        {
          id: 22, label: 'Receive Voucher', route: '/entry/receive-voucher'
        },
        {
          id: 23, label: 'Journal/Contra Voucher', route: '/entry/journal-voucher'
        },
      ]
    },
    {
      id: 3, label: 'Reports', icon: 'income-entry', menu: [
        // {
        //   id: 31, label: 'Receipt Payment', route: '/reports/receipt-payment'
        // },
        {
          id: 32, label: 'Trial Balance', route: '/reports/trial-balance'
        },
        {
          id: 33, label: 'General Transaction', route: '/reports/general-ledger'
        },
        // {
        //   id: 34, label: 'General CashBook', route: '/reports/general-cashbook'
        // },
        {
          id: 35, label: 'Transactions', route: 'reports/transactions'
        },
        {
          id: 35, label: 'Income & Expense', route: 'reports/income-expense-statement'
        },
      ]
    },
    // {
    //   id: 4, label: 'User Access', icon: 'users', route: '/user-access'
    // },
  ]);

}
