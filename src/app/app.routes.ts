import { Routes } from '@angular/router';
import { MainComponent } from './components/layouts/main/main.component';
import { HomeComponent } from './components/pages/home/home.component';
import { AccountSetupComponent } from './components/pages/account-setup/account-setup.component';
import { ExpenseEntryComponent } from './components/pages/expense-entry/expense-entry.component';
import { IncomeEntryComponent } from './components/pages/income-entry/income-entry.component';
import { ReportsComponent } from './components/pages/reports/reports.component';

export const routes: Routes = [
    
    {
        path: '',
        component: MainComponent,
        children: [
          { path: '', redirectTo: 'home', pathMatch: 'full' },
          {
            path: '',
            component: HomeComponent
          },
          {
            path: 'account-setup',
            component: AccountSetupComponent
          },
          {
            path: 'income-entry',
            component: IncomeEntryComponent
          },
          {
            path: 'expense-entry',
            component: ExpenseEntryComponent
          },
          {
            path: 'reports',
            component: ReportsComponent
          },
        ],
      }
];
