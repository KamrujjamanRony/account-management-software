import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { DataService } from '../../shared/services/data.service';
import { Observable, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OutdoorBillService {
  private readonly http = inject(HttpClient);
  private readonly dataService = inject(DataService);

  private apiCall<T>(endpoint: string, method: 'get' | 'post' | 'put' | 'delete', body?: any): Observable<T> {
    return this.dataService.getPort().pipe(
      switchMap(port => {
        const url = `${port}/api/OutdoorBill${endpoint}`;
        return this.http.request<T>(method, url, { body });
      })
    );
  }

  addOutdoorBill(model: any): Observable<void> {
    return this.apiCall<void>('', 'post', model);
  }

  getOutdoorBill(query: string): Observable<any> {
    return this.apiCall<any>(`/SearchOutdoorBill`, 'post', {
      "search": query
    });
  }

  getOutdoorBillById(id: any): Observable<any> {
    return this.apiCall<any>(`/GetById/${id}`, 'post', {});
  }

  updateOutdoorBill(id: string | number, updateOutdoorBillRequest: any): Observable<any> {
    return this.apiCall<any>(`/EditOutdoorBill/${id}`, 'put', updateOutdoorBillRequest);
  }

  deleteOutdoorBill(id: string | number): Observable<any> {
    return this.apiCall<any>(`/Delete?id=${id}`, 'post');
  }
}
