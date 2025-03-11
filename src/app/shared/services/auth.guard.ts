import { inject, Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    private router = inject(Router);
    private authService = inject(AuthService);

    canActivate(): boolean {
        const auth = this.authService.getAdminInfo();
        console.log(auth)
        if (!auth.token) {
            this.router.navigate(['/admin-login']);
            return false;
        }
        return true;
    }
}
