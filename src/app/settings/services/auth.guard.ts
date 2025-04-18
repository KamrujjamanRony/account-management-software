import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router: Router = inject(Router);
  const userInfo = localStorage.getItem('hmsUser');
  if (userInfo) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};

