import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DoctorFeeSidebarComponent } from "../../doctor-fee/components/doctor-fee-sidebar/doctor-fee-sidebar.component";
import { AuthService } from '../../settings/services/auth.service';

@Component({
  selector: 'app-doctor-fee-layout',
  imports: [RouterOutlet, DoctorFeeSidebarComponent],
  templateUrl: './doctor-fee-layout.component.html',
  styleUrl: './doctor-fee-layout.component.css'
})
export class DoctorFeeLayoutComponent {
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
