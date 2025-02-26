import { ApplicationConfig, provideExperimentalZonelessChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation, withPreloading } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { CustomPreLoadingStrategy } from './shared/services/custom.preloading';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes, withHashLocation(), withPreloading(CustomPreLoadingStrategy)), provideExperimentalZonelessChangeDetection(), provideHttpClient()]
};
