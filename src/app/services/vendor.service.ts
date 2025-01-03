import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { DataService } from './data.service';

@Injectable({
  providedIn: 'root',
})
export class VendorService {
  private readonly http = inject(HttpClient);
  private readonly dataService = inject(DataService);

  private apiCall<T>(endpoint: string, method: 'get' | 'post' | 'put' | 'delete', body?: any): Observable<T> {
    return this.dataService.getPort().pipe(
      switchMap(port => {
        const url = `http://localhost:${port}/api/Vendor${endpoint}`;
        return this.http.request<T>(method, url, { body });
      })
    );
  }

  addVendor(model: any | FormData): Observable<void> {
    return this.apiCall<void>('', 'post', model);
  }

  getVendor(query: string): Observable<any> {
    return this.apiCall<any>(`/SearchVendor?Search=${query}`, 'post');
  }

  updateVendor(id: string | number, updateVendorRequest: any | FormData): Observable<any> {
    return this.apiCall<any>(`/EditVendor/${id}`, 'put', updateVendorRequest);
  }

  deleteVendor(id: string | number): Observable<any> {
    return this.apiCall<any>(`/DeleteVendor?id=${id}`, 'delete');
  }
}
