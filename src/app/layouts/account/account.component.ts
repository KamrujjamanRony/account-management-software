import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AccountSidebarComponent } from '../../accounts/components/account-sidebar/account-sidebar.component';
import { AuthService } from '../../settings/services/auth.service';

@Component({
  selector: 'app-account',
  imports: [RouterOutlet, AccountSidebarComponent],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css'
})
export class AccountComponent {
  private authService = inject(AuthService);
  user = signal<any>({});

  ngOnInit() {
    this.user.set(this.authService.getUser());
  }

  isMenuPermission(menuName: string) {
    const menuPermission = this.user()?.userMenu.find((user: any) => user?.menuName?.toLowerCase() === menuName?.toLowerCase());
    if (menuPermission) {
      return true;
    }
    return false;
  }

}
