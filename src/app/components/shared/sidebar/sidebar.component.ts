import { Component } from '@angular/core';
import { SvgComponent } from "../svg/svg.component";
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [SvgComponent, RouterLink],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  menuData = [
    {
      label: 'account setup',
      icon: 'account-setup',
      route: '/account-setup'
    },
    {
      label: 'income entry',
      icon: 'income-entry',
      route: '/income-entry'
    },
    {
      label: 'expense entry',
      icon: 'expense-entry',
      route: '/expense-entry',
    },
    {
      label: 'reports',
      icon: 'reports',
      route: '/reports'
    },
    {
      label: 'sign out',
      icon: 'sign-out',
      route: '/sign-out',
    },
  ]

}
