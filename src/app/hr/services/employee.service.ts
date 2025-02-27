import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { DataService } from '../../shared/services/data.service';
import { Observable, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private readonly http = inject(HttpClient);
  private readonly dataService = inject(DataService);

  private apiCall<T>(endpoint: string, method: 'get' | 'post' | 'put' | 'delete', body?: any): Observable<T> {
    return this.dataService.getPort().pipe(
      switchMap(port => {
        const url = `${port}/api/Employee${endpoint}`;
        return this.http.request<T>(method, url, { body });
      })
    );
  }

  addEmployee(model: any): Observable<void> {
    return this.apiCall<void>('', 'post', model);
  }

  getEmployee(query: string): Observable<any> {
    return this.apiCall<any>(`/SearchEmployee?Search=${query}`, 'post');
  }

  updateEmployee(id: string | number, updateEmployeeRequest: any): Observable<any> {
    return this.apiCall<any>(`/EditEmployee/${id}`, 'put', updateEmployeeRequest);
  }

  deleteEmployee(id: string | number): Observable<any> {
    return this.apiCall<any>(`/DeleteEmployee?id=${id}`, 'delete');
  }
}
