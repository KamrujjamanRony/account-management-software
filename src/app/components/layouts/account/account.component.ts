import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AccountSidebarComponent } from '../../shared/account/account-sidebar/account-sidebar.component';

@Component({
  selector: 'app-account',
  imports: [RouterOutlet, AccountSidebarComponent],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css'
})
export class AccountComponent {

}
