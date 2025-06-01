import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HrSidebarComponent } from "../../hr/components/hr-sidebar/hr-sidebar.component";
import { AuthService } from '../../settings/services/auth.service';

@Component({
  selector: 'app-hr-layout',
  imports: [RouterOutlet, HrSidebarComponent],
  templateUrl: './hr-layout.component.html',
  styleUrl: './hr-layout.component.css'
})
export class HrLayoutComponent {
  private authService = inject(AuthService);
  user = signal<any>({});

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
