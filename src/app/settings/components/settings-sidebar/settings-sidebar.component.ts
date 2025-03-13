import { Component, signal } from '@angular/core';
import { AllSvgComponent } from "../../../shared/components/svg/all-svg/all-svg.component";
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-settings-sidebar',
  imports: [AllSvgComponent, RouterLink],
  templateUrl: './settings-sidebar.component.html',
  styleUrl: './settings-sidebar.component.css'
})
export class SettingsSidebarComponent {



  sidebarData = signal<any[]>([
    {
      id: 0, label: 'User', icon: 'users', route: '/settings/user'
    },
    {
      id: 1, label: 'Menu', icon: 'settings', route: '/settings/menu'
    },
  ]);

  menuState = signal<Record<number, boolean>>({});

  toggleMenu(itemId: number) {
    this.menuState.update(state => ({
      ...state,
      [itemId]: !state[itemId]
    }));
  }

  sidebarHovered = signal<boolean>(false);

  setSidebarHover(state: boolean) {
    this.sidebarHovered.set(state);

    // Close all submenus when hovering out
    if (!state) {
      this.menuState.set({});
    }
  }

}
