import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { AllSvgComponent } from '../../../shared/components/svg/all-svg/all-svg.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-outdoor-sidebar',
  imports: [AllSvgComponent, RouterLink],
  templateUrl: './outdoor-sidebar.component.html',
  styleUrl: './outdoor-sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutdoorSidebarComponent {



  sidebarData = signal<any[]>([
    {
      id: 0, label: 'Bill', icon: 'settings', route: '/outdoor/bill'
    },
    // {
    //   id: 1, label: 'Setup', icon: 'reports', menu: [
    //     {
    //       id: 11, label: 'Bank Setup', route: '/hr/setup/bank'
    //     },
    //     {
    //       id: 12, label: 'Vendor Setup', route: '/hr/setup/vendor'
    //     },
    //     {
    //       id: 13, label: 'Chart Of Account', route: '/hr/setup/account-chart'
    //     }
    //   ]
    // },
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
