import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AccountSidebarComponent } from '../../accounts/components/account-sidebar/account-sidebar.component';
import { AuthService } from '../../settings/services/auth.service';
import { MenuService } from '../../settings/services/menu.service';
import { environment } from '../../../environments/environment';
import { MenuItemM, MenuM } from '../../accounts/models/Menu';
import { ThemeToggle } from "../../utils/theme-toggle/theme-toggle";
import { Sidebar } from "../../accounts/components/sidebar/sidebar";
import { Breadcrumb } from "../../utils/breadcrumb/breadcrumb";

@Component({
  selector: 'app-account',
  imports: [RouterOutlet, ThemeToggle, Sidebar, Breadcrumb, RouterLink],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css'
})
export class AccountComponent {
  private authService = inject(AuthService);
  user = signal<any>({});
  currentDate = new Date().toLocaleDateString('en-GB');
  private menuService = inject(MenuService);
  private auth = inject(AuthService);
  companyName = environment.companyName;
  menus = signal<MenuM[]>([]);
  isLoading = signal(false);
  hasError = signal(false);


  menuList = computed(() => {
    if (!this.menus() || this.menus().length === 0) return [];

    // Convert to MenuItem format
    const allMenus: MenuItemM[] = this.menus().map(menu => ({
      id: menu.id,
      label: menu.menuName,
      icon: menu.icon,
      route: menu.url,
      parentMenuId: menu.parentMenuId,
      children: []
    }));
    // Function to build hierarchy
    const buildHierarchy = (parentId: number | null = null): MenuItemM[] => {
      const filtered = allMenus.filter(menu => menu.parentMenuId === parentId);
      return filtered.map(menu => ({
        ...menu,
        children: buildHierarchy(menu.id)
      }));
    };

    const hierarchy = buildHierarchy();

    // If we have root items but no nested structure, create a dummy root
    if (hierarchy.length === 0 && allMenus.length > 0) {
      // Find items with null parentId
      const rootItems = allMenus.filter(menu => menu.parentMenuId === null);
      if (rootItems.length > 0) {
        return rootItems;
      }
    }

    return hierarchy;
  });

  ngOnInit() {
    this.user.set(this.authService.getUser());
    this.loadMenus();
  }

  loadMenus() {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.menuService.search().subscribe({
      next: data => {
        this.menus.set((data as MenuM[]) ?? []);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    });
  }

  isMenuPermission(menuName: string) {
    const menuPermission = this.user()?.userMenu.find((user: any) => user?.menuName?.toLowerCase() === menuName?.toLowerCase());
    if (menuPermission) {
      return true;
    }
    return false;
  }








}
