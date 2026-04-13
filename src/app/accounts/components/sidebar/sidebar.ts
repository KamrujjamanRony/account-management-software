import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from "@angular/router";
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faImage, 
  faUser, 
  faRectangleList, 
  faAddressCard, 
  faRightFromBracket, 
  faCaretDown, 
  faCaretUp,
  faLayerGroup,
  IconDefinition,
  faHouse,
  faSackDollar,
  faChartPie,
  faBuildingColumns
} from '@fortawesome/free-solid-svg-icons';
import { CommonModule } from '@angular/common';
import { MenuItemM } from '../../models/Menu';
import { AuthService } from '../../../settings/services/auth.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, FontAwesomeModule, CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  menuList = input.required<MenuItemM[] | undefined>();
  
  // Icons
  faCaretDown = faCaretDown;
  faCaretUp = faCaretUp;
  faImage = faImage;
  faUser = faUser;
  faRectangleList = faRectangleList;
  faAddressCard = faAddressCard;
  faLayerGroup = faLayerGroup;
  faRightFromBracket = faRightFromBracket;
  faBuildingColumns = faBuildingColumns;
  faHouse = faHouse;
  faSackDollar = faSackDollar;
  faChartPie = faChartPie;
  
  auth = inject(AuthService);

  menuState = signal<Record<number, boolean>>({});

  filteredList = computed(() => {
    return this.menuList()?.filter(menu => menu.route?.includes('/accounts'))[0].children || [];
  });

  // Map icon strings to FontAwesome icons
  getIcon(iconName: string | undefined): IconDefinition | undefined {
    if (!iconName) return undefined;
    
    switch(iconName) {
      case 'faHouse': return this.faHouse;
      case 'faBuildingColumns': return this.faBuildingColumns;
      case 'faLayerGroup': return this.faLayerGroup;
      case 'faSackDollar': return this.faSackDollar;
      case 'faChartPie': return this.faChartPie;
      default: return undefined;
    }
  }

  toggleMenu(itemId: number) {
    this.menuState.update(state => ({
      ...state,
      [itemId]: !state[itemId]
    }));
  }

  sidebarHovered = signal<boolean>(false);

  setSidebarHover(state: boolean) {
    this.sidebarHovered.set(state);
  }

  onLogOut() {
    this.auth.deleteUser();
    window.location.href = '/login'; // Optionally, navigate to login page or show a message
    // Optionally, navigate to login page or show a message
  }
}