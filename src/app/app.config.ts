import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation, withPreloading } from '@angular/router';

import { routes } from './app.routes';
import { CustomPreLoadingStrategy } from './shared/services/custom.preloading';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './settings/services/auth.interceptor';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { MessageService } from 'primeng/api';
import { CookieService } from 'ngx-cookie-service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withHashLocation(), withPreloading(CustomPreLoadingStrategy)),
    provideHttpClient(withInterceptors([authInterceptor])),
    CookieService,
    MessageService,
    providePrimeNG({
      theme: {
        preset: Aura
      }
    })
  ]
};
