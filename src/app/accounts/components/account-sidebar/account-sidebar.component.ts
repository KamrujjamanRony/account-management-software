import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AllSvgComponent } from '../../../shared/components/svg/all-svg/all-svg.component';

@Component({
  selector: 'app-account-sidebar',
  imports: [RouterLink, AllSvgComponent, CommonModule],
  templateUrl: './account-sidebar.component.html',
  styleUrl: './account-sidebar.component.css'
})
export class AccountSidebarComponent {



  sidebarData = signal<any[]>([
    {
      id: 0, label: 'Dashboard', icon: 'settings', route: '/accounts'
    },
    {
      id: 1, label: 'Setup', icon: 'reports', menu: [
        {
          id: 11, label: 'Bank Setup', route: '/accounts/setup/bank'
        },
        // {
        //   id: 12, label: 'Vendor Setup', route: '/accounts/setup/vendor'
        // },
        {
          id: 13, label: 'Chart Of Account', route: '/accounts/setup/account-chart'
        }
      ]
    },
    {
      id: 2, label: 'Entry', icon: 'expense-entry', menu: [
        {
          id: 21, label: 'Payment Voucher', route: '/accounts/entry/payment-voucher'
        },
        {
          id: 22, label: 'Receive Voucher', route: '/accounts/entry/receive-voucher'
        },
        {
          id: 23, label: 'Journal/Contra Voucher', route: '/accounts/entry/journal-voucher'
        },
      ]
    },
    {
      id: 3, label: 'Reports', icon: 'income-entry', menu: [
        // {
        //   id: 31, label: 'Receipt Payment', route: '/accounts/reports/receipt-payment'
        // },
        {
          id: 32, label: 'Trial Balance', route: '/accounts/reports/trial-balance'
        },
        {
          id: 33, label: 'General Transaction', route: '/accounts/reports/general-ledger'
        },
        // {
        //   id: 34, label: 'General CashBook', route: '/accounts/reports/general-cashbook'
        // },
        {
          id: 35, label: 'Transactions', route: '/accounts/reports/transactions'
        },
        {
          id: 35, label: 'Income & Expense', route: '/accounts/reports/income-expense-statement'
        },
      ]
    },
  ]);

  menuState = signal<Record<number, boolean>>({});

  toggleMenu(itemId: number) {
    this.menuState.update(state => ({
      ...state,
      [itemId]: !state[itemId]
    }));
  }

  sidebarHovered = signal<boolean>(false);

  setSidebarHover(state: boolean) {
    this.sidebarHovered.set(state);

    // Close all submenus when hovering out
    if (!state) {
      this.menuState.set({});
    }
  }

}
