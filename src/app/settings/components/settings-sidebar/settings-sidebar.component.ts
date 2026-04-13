import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUsers, faBars, faCaretDown, faCaretUp, IconDefinition } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-settings-sidebar',
  imports: [RouterLink, RouterLinkActive, FontAwesomeModule],
  templateUrl: './settings-sidebar.component.html',
  styleUrl: './settings-sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsSidebarComponent {
  faUsers = faUsers;
  faBars = faBars;
  faCaretDown = faCaretDown;
  faCaretUp = faCaretUp;

  sidebarData = signal<any[]>([
    {
      id: 0, label: 'User', icon: 'faUsers', route: '/settings/user'
    },
    {
      id: 1, label: 'Menu', icon: 'faBars', route: '/settings/menu'
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

  getIcon(iconName: string): IconDefinition {
    switch (iconName) {
      case 'faUsers': return this.faUsers;
      case 'faBars': return this.faBars;
      default: return this.faUsers;
    }
  }
}
