import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { DataService } from '../../shared/services/data.service';
import { AssetTypeM } from '../models/asset-type';

@Injectable({
  providedIn: 'root',
})
export class AssetTypeService {
  private readonly http = inject(HttpClient);
  private readonly dataService = inject(DataService);

  private apiCall<T>(endpoint: string, method: 'get' | 'post' | 'put' | 'delete', body?: any): Observable<T> {
    return this.dataService.getPort().pipe(
      switchMap(port => {
        const url = `${port}/api/AssetType${endpoint}`;
        return this.http.request<T>(method, url, { body });
      })
    );
  }

  add(model: any): Observable<void> {
    return this.apiCall<void>('', 'post', model);
  }

  search(id: string | number): Observable<AssetTypeM[]> {
    // For search, you might need to adjust based on your API
    // If search expects an object with search criteria
    const searchParams = {
        ...(id && +id > 0 ? { id: +id } : {})
    };
    return this.apiCall<AssetTypeM[]>('/Search', 'post', searchParams);
  }

  update(id: string | number, updateAssetTypeRequest: any): Observable<any> {
    return this.apiCall<any>(`/${id}`, 'put', updateAssetTypeRequest);
  }

  delete(id: string | number): Observable<any> {
    return this.apiCall<any>(`/${id}`, 'delete');
  }
}