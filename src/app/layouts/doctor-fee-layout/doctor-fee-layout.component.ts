import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { DoctorFeeSidebarComponent } from "../../doctor-fee/components/doctor-fee-sidebar/doctor-fee-sidebar.component";
import { AuthService } from '../../settings/services/auth.service';
import { environment } from '../../../environments/environment';
import { ThemeToggle } from "../../utils/theme-toggle/theme-toggle";
import { Breadcrumb } from "../../utils/breadcrumb/breadcrumb";

@Component({
  selector: 'app-doctor-fee-layout',
  imports: [RouterOutlet, RouterLink, DoctorFeeSidebarComponent, ThemeToggle, Breadcrumb],
  templateUrl: './doctor-fee-layout.component.html',
  styleUrl: './doctor-fee-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoctorFeeLayoutComponent {
  private authService = inject(AuthService);
  user = signal<any>({});
  currentDate = new Date().toLocaleDateString('en-GB');
  companyName = environment.companyName;

  ngOnInit() {
    this.user.set(this.authService.getUser());
  }

  isMenuPermission(menuName: string) {
    const menuPermission = this.user()?.userMenu?.find((user: any) => user?.menuName?.toLowerCase() === menuName?.toLowerCase());
    if (menuPermission) {
      return true;
    }
    return false;
  }
}
