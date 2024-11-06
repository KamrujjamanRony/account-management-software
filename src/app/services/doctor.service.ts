import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DoctorService {

  http = inject(HttpClient);

  addDoctor(model: any | FormData): Observable<void>{
    return this.http.post<void>('http://localhost:3000/doctor', model)
  }

  getAllDoctors(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/doctor');
  }

  getDoctor(id: any): Observable<any> {
    return this.http.get<any>(`http://localhost:3000/doctor/${id}`);
  }

  updateDoctor(id: any, updateDoctorRequest: any | FormData): Observable<any>{
    return this.http.put<any>(`http://localhost:3000/doctor/${id}`, updateDoctorRequest);
  }

  deleteDoctor(id: any): Observable<any>{
    return this.http.delete<any>(`http://localhost:3000/doctor/${id}`);
  }
}
