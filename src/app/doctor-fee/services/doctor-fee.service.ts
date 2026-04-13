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

  add(model: any): Observable<any> {
    return this.apiCall<any>('', 'post', model);
  }

  search(search: string = '', fromDate: string = '', toDate: string = ''): Observable<any> {
    const body = {
      ...search && { search },
      ...fromDate && { fromDate },
      ...toDate && { toDate }
    };
    return this.apiCall<any>('/Search', 'post', body);
  }

  update(id: any, updateRequest: any): Observable<any> {
    return this.apiCall<any>(`/${id}`, 'put', updateRequest);
  }

  delete(id: any): Observable<any> {
    return this.apiCall<any>(`/${id}`, 'delete');
  }

  getFilteredDoctorFee(fromDate: any, toDate: any, nextFlowDate: any): Observable<any> {
    const endPoint = nextFlowDate ? `nextFlowDate=${nextFlowDate}` : `fromDate=${fromDate}&toDate=${toDate ? toDate : fromDate}`;
    return this.apiCall<any>(`/GetDoctorNextFlowDateSearch?${endPoint}`, 'post', {});
  }

  getDoctorFee(id: any): Observable<any> {
    return this.apiCall<any>(`/GetDoctorNextFlowDateSearch?doctorId=${id}`, 'get');
  }
}
