import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { DataService } from '../../shared/services/data.service';
import { Observable, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  private readonly http = inject(HttpClient);
  private readonly dataService = inject(DataService);

  private apiCall<T>(endpoint: string, method: 'get' | 'post' | 'put' | 'delete', body?: any): Observable<T> {
    return this.dataService.getPort().pipe(
      switchMap(port => {
        const url = `${port}/api/Menu${endpoint}`;
        return this.http.request<T>(method, url, { body });
      })
    );
  }

  addMenu(model: any): Observable<any> {
    return this.apiCall<any>('', 'post', model);
  }

  getAllMenu(): Observable<any> {
    return this.apiCall<any>('/SearchMenu', 'post', {});
  }

  getMenu(id: any): Observable<any> {
    return this.apiCall<any>(`/GetById/${id}`, 'post');
  }

  updateMenu(id: any, updateRequest: any): Observable<any> {
    return this.apiCall<any>(`/EditMenu/${id}`, 'put', updateRequest);
  }

  deleteMenu(id: any): Observable<any> {
    return this.apiCall<any>(`/DeleteMenu?id=${id}`, 'delete', {});
  }

  generateTreeData(userId: any = ''): Observable<any> {
    return this.apiCall<any>(`/GenerateTreeData?userId=${userId}`, 'post');
  }
}
