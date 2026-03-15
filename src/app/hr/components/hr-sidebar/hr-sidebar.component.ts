import { Component, signal } from '@angular/core';
import { AllSvgComponent } from "../../../shared/components/svg/all-svg/all-svg.component";
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-hr-sidebar',
  imports: [AllSvgComponent, RouterLink],
  templateUrl: './hr-sidebar.component.html',
  styleUrl: './hr-sidebar.component.css'
})
export class HrSidebarComponent {



  sidebarData = signal<any[]>([
    {
      id: 0, label: 'Dashboard', icon: 'settings', route: '/hr'
    },
    // {
    //   id: 1, label: 'Setup', icon: 'reports', menu: [
    //     {
    //       id: 11, label: 'Bank Setup', route: '/hr/setup/bank'
    //     },
    //     {
    //       id: 12, label: 'Vendor Setup', route: '/hr/setup/vendor'
    //     },
    //     {
    //       id: 13, label: 'Chart Of Account', route: '/hr/setup/account-chart'
    //     }
    //   ]
    // },
    {
      id: 2, label: 'Entry', icon: 'expense-entry', menu: [
        {
          id: 21, label: 'Employee Entry', route: '/hr/entry/employee'
        },
        // {
        //   id: 22, label: 'Receive Voucher', route: '/hr/entry/receive-voucher'
        // },
        // {
        //   id: 23, label: 'Journal/Contra Voucher', route: '/hr/entry/journal-voucher'
        // },
      ]
    },
    // {
    //   id: 3, label: 'Reports', icon: 'income-entry', menu: [
    //     {
    //       id: 31, label: 'Receipt Payment', route: '/hr/reports/receipt-payment'
    //     },
    //     {
    //       id: 32, label: 'Trial Balance', route: '/hr/reports/trial-balance'
    //     },
    //     {
    //       id: 33, label: 'General Transaction', route: '/hr/reports/general-ledger'
    //     },
    //     {
    //       id: 34, label: 'General CashBook', route: '/hr/reports/general-cashbook'
    //     },
    //     {
    //       id: 35, label: 'Transactions', route: '/hr/reports/transactions'
    //     },
    //     {
    //       id: 35, label: 'Income & Expense', route: '/hr/reports/income-expense-statement'
    //     },
    //   ]
    // },
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
