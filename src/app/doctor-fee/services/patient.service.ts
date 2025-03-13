import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { DataService } from '../../shared/services/data.service';

@Injectable({
  providedIn: 'root'
})
export class PatientService {

  private readonly http = inject(HttpClient);
  private readonly dataService = inject(DataService);

  private apiCall<T>(endpoint: string, method: 'get' | 'post' | 'put' | 'delete', body?: any): Observable<T> {
    return this.dataService.getPort().pipe(
      switchMap(port => {
        const url = `${port}/api/PatientReg${endpoint}`;
        return this.http.request<T>(method, url, { body });
      })
    );
  }

  addPatient(model: any): Observable<any> {
    return this.apiCall<any>('', 'post', model);
  }

  getAllPatients(): Observable<any> {
    return this.apiCall<any>('/SearchPatient', 'post', {});
  }

  getPatient(id: any): Observable<any> {
    return this.apiCall<any>(`/${id}`, 'get');
  }

  updatePatient(id: any, updateRequest: any): Observable<any> {
    return this.apiCall<any>(`/EditPatientReg/${id}`, 'put', updateRequest);
  }

  deletePatient(id: any): Observable<any> {
    return this.apiCall<any>(`/DeletePatientReg?id=${id}`, 'post', {});
  }
}
