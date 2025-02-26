import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { EMPTY, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class CustomPreLoadingStrategy implements PreloadingStrategy {
    preload(route: Route, fn: () => Observable<any>): Observable<any> {
        if (route.data?.['preload']) {
            console.log(`Preloading route: ${route.path}`);
            return fn();
        }
        console.log(`Skipping preload for route: ${route.path}`);
        return EMPTY;
    }
}