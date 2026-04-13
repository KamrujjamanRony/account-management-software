import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AuthService } from '../../settings/services/auth.service';
import { RouterOutlet } from "@angular/router";
import { OutdoorSidebarComponent } from "../../outdoor/components/outdoor-sidebar/outdoor-sidebar.component";

@Component({
  selector: 'app-outdoor',
  imports: [RouterOutlet, OutdoorSidebarComponent],
  templateUrl: './outdoor.component.html',
  styleUrl: './outdoor.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutdoorComponent {
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
