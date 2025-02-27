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
        const customPort = port.split(":")[0] + ':' + port.split(":")[1] + ':80';
        const url = `${customPort}/hms/api/PatientReg${endpoint}`;
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

  // http = inject(HttpClient);
  // rootUrl = 'http://192.168.0.138/hms/api/PatientReg'

  // addPatient(model: any | FormData): Observable<void> {
  //   return this.http.post<void>(this.rootUrl, model)
  // }

  // getAllPatients(): Observable<any[]> {
  //   return this.http.post<any[]>(this.rootUrl + '/SearchPatient', '');
  // }

  // getPatient(id: any): Observable<any> {
  //   return this.http.get<any>(`${this.rootUrl}/${id}`);
  // }

  // updatePatient(id: any, updatePatientRequest: any | FormData): Observable<any> {
  //   return this.http.put<any>(`${this.rootUrl}/EditPatientReg/${id}`, updatePatientRequest);
  // }

  // deletePatient(id: any): Observable<any> {
  //   return this.http.post<any>(`${this.rootUrl}/DeletePatientReg?id=${id}`, '');
  // }
}
