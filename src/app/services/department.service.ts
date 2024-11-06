import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private apiUrl = 'http://localhost:3000/departments';

  http = inject(HttpClient);

  addDepartment(model: any | FormData): Observable<void>{
    return this.http.post<void>(this.apiUrl, model)
  }

  getAllDepartments(type: any): Observable<any[]> {
    return type ? this.http.get<any[]>(`${this.apiUrl}?type=${type}`) : this.http.get<any[]>(this.apiUrl);
  }

  getDepartment(id: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  updateDepartment(id: any, updateDepartmentRequest: any | FormData): Observable<any>{
    return this.http.put<any>(`${this.apiUrl}/${id}`, updateDepartmentRequest);
  }

  deleteDepartment(id: any): Observable<any>{
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
