import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SubSubDepartmentService {
  private apiUrl = 'http://localhost:3000/subDepartments';

  http = inject(HttpClient);

  addSubDepartment(model: any | FormData): Observable<void>{
    return this.http.post<void>(this.apiUrl, model)
  }

  getAllSubDepartments(departmentName: any): Observable<any[]> {
    return departmentName ? this.http.get<any[]>(`${this.apiUrl}?department=${departmentName}`) : this.http.get<any[]>(this.apiUrl);
  }

  getSubDepartment(id: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  updateSubDepartment(id: any, updateSubDepartmentRequest: any | FormData): Observable<any>{
    return this.http.put<any>(`${this.apiUrl}/${id}`, updateSubDepartmentRequest);
  }

  deleteSubDepartment(id: any): Observable<any>{
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
