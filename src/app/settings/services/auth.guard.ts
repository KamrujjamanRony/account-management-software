import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router: Router = inject(Router);
  const userInfo = authService.getUser();
  if (userInfo) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};

