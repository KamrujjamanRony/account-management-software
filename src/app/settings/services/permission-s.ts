import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({providedIn: 'root'})

export class PermissionS {
  private auth = inject(AuthService);

  hasPermission(moduleName: string, permission: string = ''): boolean {
    const user = this.auth.getUser();
    if (!user || !user.userMenu) return false;
    const module = user.userMenu.find((m: any) => m.menuName?.toLowerCase() === moduleName.toLowerCase());
    if (!module) return false;
    if (!permission) return true;
    if (!Array.isArray(module.permissions)) return false;

    return module.permissions.some((p: string) => p.toLowerCase() === permission.toLowerCase());
  }
}
