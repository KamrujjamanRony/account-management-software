import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SettingsSidebarComponent } from "../../settings/components/settings-sidebar/settings-sidebar.component";
import { AuthService } from '../../settings/services/auth.service';

@Component({
  selector: 'app-settings-layout',
  imports: [RouterOutlet, SettingsSidebarComponent],
  templateUrl: './settings-layout.component.html',
  styleUrl: './settings-layout.component.css'
})
export class SettingsLayoutComponent {
  private authService = inject(AuthService);
  user = signal<any>({});

  ngOnInit() {
    this.user.set(this.authService.getUser());
    console.log(this.user());
  }

  isMenuPermission(menuName: string) {
    const menuPermission = this.user()?.userMenu.find((user: any) => user?.menuName.toLowerCase() === menuName.toLowerCase());
    if (menuPermission) {
      return true;
    }
    return false;
  }

}
