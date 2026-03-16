import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { DataService } from '../../shared/services/data.service';
import { AssetDescriptionM } from '../models/asset-description.model';

@Injectable({
  providedIn: 'root',
})
export class AssetDescriptionService {
  private readonly http = inject(HttpClient);
  private readonly dataService = inject(DataService);

  private apiCall<T>(endpoint: string, method: 'get' | 'post' | 'put' | 'delete', body?: any): Observable<T> {
    return this.dataService.getPort().pipe(
      switchMap(port => {
        const url = `${port}/api/AssetDescription${endpoint}`;
        return this.http.request<T>(method, url, { body });
      })
    );
  }

  add(model: any): Observable<void> {
    return this.apiCall<void>('', 'post', model);
  }

  search(id: number = 0, fromDate?: Date, toDate?: Date): Observable<AssetDescriptionM[]> {
    const searchParams = {
        ...(id && +id > 0 ? { id: +id } : {}),
        ...(fromDate ? { fromDate: fromDate.toISOString() } : {}),
        ...(toDate ? { toDate: toDate.toISOString() } : {})
    };
    return this.apiCall<AssetDescriptionM[]>('/Search', 'post', searchParams);
  }

  update(id: string | number, updateRequest: any): Observable<any> {
    return this.apiCall<any>(`/${id}`, 'put', updateRequest);
  }

  delete(id: string | number): Observable<any> {
    return this.apiCall<any>(`/${id}`, 'delete');
  }
}