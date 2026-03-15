import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../settings/services/auth.service';
import { DataService } from '../shared/services/data.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  private dataService = inject(DataService);
  user = signal<any>({});
  modules = signal<any>([]);

  ngOnInit() {
    this.dataService.getModules().subscribe((data) => {
      this.modules.set(data);
    }
    );
  }

  isMenuPermission(menuName: string) {
    const menuPermission = this.modules()?.find((moduleName: any) => moduleName.toLowerCase() === menuName.toLowerCase());
    if (menuPermission) {
      return true;
    }
    return false;
  }

}
