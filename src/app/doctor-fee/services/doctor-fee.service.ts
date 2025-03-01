import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { DataService } from '../../shared/services/data.service';

@Injectable({
  providedIn: 'root'
})
export class DoctorFeeService {

  private readonly http = inject(HttpClient);
  private readonly dataService = inject(DataService);

  private apiCall<T>(endpoint: string, method: 'get' | 'post' | 'put' | 'delete', body?: any): Observable<T> {
    return this.dataService.getPort().pipe(
      switchMap(port => {
        const url = `${port}/api/DoctorFee${endpoint}`;
        return this.http.request<T>(method, url, { body });
      })
    );
  }

  addDoctorFee(model: any): Observable<any> {
    return this.apiCall<any>('', 'post', model);
  }

  getAllDoctorFees(): Observable<any> {
    return this.apiCall<any>('/SearchDoctorFee', 'post', {});
  }

  getFilteredDoctorFee(fromDate: any, toDate: any, nextFlowDate: any): Observable<any> {
    console.log(fromDate, toDate, nextFlowDate)
    const endPoint = nextFlowDate ? `nextFlowDate=${nextFlowDate}` : `fromDate=${fromDate}&toDate=${toDate ? toDate : fromDate}`;
    return this.apiCall<any>(`/GetDoctorNextFlowDateSearch?${endPoint}`, 'post', {});
  }

  getDoctorFee(id: any): Observable<any> {
    return this.apiCall<any>(`/GetDoctorNextFlowDateSearch?doctorId=${id}`, 'get');
  }

  updateDoctorFee(id: any, updateRequest: any): Observable<any> {
    return this.apiCall<any>(`/EditDoctorFee/${id}`, 'put', updateRequest);
  }

  deleteDoctorFee(id: any): Observable<any> {
    return this.apiCall<any>(`/DeleteDoctorFee?id=${id}`, 'post', {});
  }



  // rootUrl = 'http://192.168.0.138/hms/api/DoctorFee'

  // getAllDoctorFees(): Observable<any[]> {
  //   return this.http.post<any[]>(this.rootUrl + '/SearchDoctorFee', {});
  // }

  // getFilteredDoctorFee(fromDate: any, toDate: any, nextFlowDate: any): Observable<any> {
  //   console.log(fromDate, toDate, nextFlowDate)
  //   const endPoint = nextFlowDate ? `nextFlowDate=${nextFlowDate}` : `fromDate=${fromDate}&toDate=${toDate ? toDate : fromDate}`;
  //   return this.http.post<any>(`${this.rootUrl}/GetDoctorNextFlowDateSearch?${endPoint}`, {});
  // }

  // getDoctorFee(id: any): Observable<any> {
  //   return this.http.get<any>(`${this.rootUrl}/GetDoctorNextFlowDateSearch?doctorId=${id}`);
  // }

  // updateDoctorFee(id: any, updateDoctorFeeRequest: any | FormData): Observable<any> {
  //   return this.http.put<any>(`${this.rootUrl}/EditDoctorFee/${id}`, updateDoctorFeeRequest);
  // }

  // deleteDoctorFee(id: any): Observable<any> {
  //   return this.http.post<any>(`${this.rootUrl}/DeleteDoctorFee?id=${id}`, {});
  // }
}
