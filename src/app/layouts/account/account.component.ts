import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AccountSidebarComponent } from '../../accounts/components/account-sidebar/account-sidebar.component';

@Component({
  selector: 'app-account',
  imports: [RouterOutlet, AccountSidebarComponent],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css'
})
export class AccountComponent {

}
