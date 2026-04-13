import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { SettingsSidebarComponent } from "../../settings/components/settings-sidebar/settings-sidebar.component";
import { AuthService } from '../../settings/services/auth.service';
import { environment } from '../../../environments/environment';
import { ThemeToggle } from "../../utils/theme-toggle/theme-toggle";
import { Breadcrumb } from "../../utils/breadcrumb/breadcrumb";

@Component({
  selector: 'app-settings-layout',
  imports: [RouterOutlet, RouterLink, SettingsSidebarComponent, ThemeToggle, Breadcrumb],
  templateUrl: './settings-layout.component.html',
  styleUrl: './settings-layout.component.css'
})
export class SettingsLayoutComponent {
  private authService = inject(AuthService);
  user = signal<any>({});
  currentDate = new Date().toLocaleDateString('en-GB');
  companyName = environment.companyName;

  ngOnInit() {
    this.user.set(this.authService.getUser());
  }

  isMenuPermission(menuName: string) {
    const menuPermission = this.user()?.userMenu.find((user: any) => user?.menuName.toLowerCase() === menuName.toLowerCase());
    if (menuPermission) {
      return true;
    }
    return false;
  }

}
