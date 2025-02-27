import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { DataService } from '../../shared/services/data.service';

@Injectable({
  providedIn: 'root'
})
export class DoctorService {

  private readonly http = inject(HttpClient);
  private readonly dataService = inject(DataService);

  private apiCall<T>(endpoint: string, method: 'get' | 'post' | 'put' | 'delete', body?: any): Observable<T> {
    return this.dataService.getPort().pipe(
      switchMap(port => {
        const customPort = port.split(":")[0] + ':' + port.split(":")[1] + ':80';
        const url = `${customPort}/hms/api/DoctorEntry${endpoint}`;
        return this.http.request<T>(method, url, { body });
      })
    );
  }

  addDoctor(model: any): Observable<void> {
    return this.apiCall<any>('', 'post', model);
  }

  getAllDoctors(): Observable<any> {
    return this.apiCall<any>('/SearchDoctor', 'post', {});
  }

  getFilterDoctors(isChamberDoctor: any, takeCom: any): Observable<any> {
    return this.apiCall<any>(`/SearchDoctor?isChamberDoctor=${isChamberDoctor !== undefined ? isChamberDoctor : ""}&takeCom=${takeCom !== undefined ? takeCom : ""}`, 'post', {});
  }

  getDoctor(id: any): Observable<any> {
    return this.apiCall<any>(`/${id}`, 'get');
  }

  updateDoctor(id: any, updateRequest: any): Observable<any> {
    return this.apiCall<any>(`/EditDoctorEntry/${id}`, 'put', updateRequest);
  }

  deleteDoctor(id: any): Observable<any> {
    return this.apiCall<any>(`/DeleteDoctorEntry?id=${id}`, 'post', {});
  }

  // http = inject(HttpClient);
  // rootUrl = 'http://192.168.0.138/hms/api/DoctorEntry'

  // addDoctor(model: any | FormData): Observable<void> {
  //   return this.http.post<void>(this.rootUrl, model)
  // }

  // getAllDoctors(): Observable<any[]> {
  //   return this.http.post<any[]>(this.rootUrl + '/SearchDoctor', {});
  // }

  // getFilterDoctors(isChamberDoctor: any, takeCom: any): Observable<any[]> {
  //   return this.http.post<any[]>(this.rootUrl + `/SearchDoctor?isChamberDoctor=${isChamberDoctor !== undefined ? isChamberDoctor : ""}&takeCom=${takeCom !== undefined ? takeCom : ""}`, {});
  // }

  // getDoctor(id: any): Observable<any> {
  //   return this.http.get<any>(`${this.rootUrl}/${id}`);
  // }

  // updateDoctor(id: any, updateDoctorRequest: any | FormData): Observable<any> {
  //   return this.http.put<any>(`${this.rootUrl}/EditDoctorEntry/${id}`, updateDoctorRequest);
  // }

  // deleteDoctor(id: any): Observable<any> {
  //   return this.http.post<any>(`${this.rootUrl}/DeleteDoctorEntry?id=${id}`, '');
  // }
}
