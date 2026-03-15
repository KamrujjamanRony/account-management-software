import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { DataService } from './data.service';

@Injectable({
    providedIn: 'root'
})
export class AdminService {
    private readonly http = inject(HttpClient);
    private readonly dataService = inject(DataService);

    private apiCall<T>(endpoint: string, method: 'get' | 'post' | 'put' | 'delete', body?: any): Observable<T> {
        return this.dataService.getPort().pipe(
            switchMap(port => {
                const url = `${port}/admin${endpoint}`;
                return this.http.request<T>(method, url, { body });
            })
        );
    }


    registerAdmin(model: any): Observable<void> {
        return this.apiCall<void>('/register', 'post', model);
    }

    loginAdmin(model: any): Observable<void> {
        return this.apiCall<void>('/login', 'post', model);
    }

    getAllAdmins(): Observable<void> {
        return this.apiCall<void>('', 'get');
    }

    getAdmin(id: any): Observable<void> {
        return this.apiCall<void>(`/${id}`, 'get');
    }

    updateAdmin(id: string | number, updateNewsRequest: any): Observable<any> {
        return this.apiCall<any>(`/${id}`, 'put', updateNewsRequest);
    }

    deleteAdmin(id: string | number): Observable<any> {
        return this.apiCall<any>(`/${id}`, 'delete');
    }
}
