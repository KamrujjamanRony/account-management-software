import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { DataService } from '../../shared/services/data.service';
import { Observable, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FixedAssetService {
  private readonly http = inject(HttpClient);
  private readonly dataService = inject(DataService);

  private apiCall<T>(endpoint: string, method: 'get' | 'post' | 'put' | 'delete', body?: any): Observable<T> {
    return this.dataService.getPort().pipe(
      switchMap(port => {
        const url = `${port}/api/Bank${endpoint}`;
        return this.http.request<T>(method, url, { body });
      })
    );
  }

  addFixedAsset(model: any): Observable<void> {
    return this.apiCall<void>('', 'post', model);
  }

  getFixedAsset(query: string): Observable<any> {
    return this.apiCall<any>(`/SearchBank?Search=${query}`, 'post');
  }

  updateFixedAsset(id: string | number, updateFixedAssetRequest: any): Observable<any> {
    return this.apiCall<any>(`/EditFixedAsset/${id}`, 'put', updateFixedAssetRequest);
  }

  deleteFixedAsset(id: string | number): Observable<any> {
    return this.apiCall<any>(`/DeleteFixedAsset?id=${id}`, 'delete');
  }
}
