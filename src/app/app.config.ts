import { ApplicationConfig, provideExperimentalZonelessChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation, withPreloading } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { CustomPreLoadingStrategy } from './shared/services/custom.preloading';
import { CookieService } from 'ngx-cookie-service';
import { provideAnimations } from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { MessageService } from 'primeng/api';
import { authInterceptor } from './settings/services/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withHashLocation(), withPreloading(CustomPreLoadingStrategy)),
    provideExperimentalZonelessChangeDetection(),
    provideHttpClient(withInterceptors([authInterceptor])),
    CookieService,
    provideAnimations(),
    MessageService,
    providePrimeNG({
      theme: {
        preset: Aura
      }
    })
  ]
};
