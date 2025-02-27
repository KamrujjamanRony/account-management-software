import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AllSvgComponent } from '../../../shared/components/svg/all-svg/all-svg.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-doctor-fee-sidebar',
  imports: [RouterLink, AllSvgComponent, CommonModule],
  templateUrl: './doctor-fee-sidebar.component.html',
  styleUrl: './doctor-fee-sidebar.component.css'
})
export class DoctorFeeSidebarComponent {
  sidebarData = signal<any[]>([
    {
      id: 1, label: 'Registration', icon: 'users', route: '/doctor-fee/registration'
    },
    {
      id: 2, label: 'Setup', icon: 'settings', menu: [
        {
          id: 21, label: 'Doctor Entry', route: '/doctor-fee/setup/doctor/entry'
        },
        {
          id: 22, label: 'Doctor Fee', route: '/doctor-fee/setup/doctor/fee'
        }
      ]
    },
    {
      id: 3, label: 'Reports', icon: 'reports', menu: [
        // {
        //   id: 31, label: 'Doctors', route: '/doctor-fee/reports/doctors-report'
        // },
        {
          id: 32, label: 'Doctor Fee', route: '/doctor-fee/reports/doctor-fee-report'
        }
      ]
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
