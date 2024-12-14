import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VendorService {

  http = inject(HttpClient);
  rootUrl = 'http://localhost:2222/api/Vendor'

  addVendor(model: any | FormData): Observable<void> {
    return this.http.post<void>(this.rootUrl, model)
  }

  getVendor(query: any): Observable<any> {
    return this.http.post<any>(`${this.rootUrl}/SearchVendor?Search=${query}`, '');
  }

  updateVendor(id: any, updateVendorRequest: any | FormData): Observable<any> {
    return this.http.put<any>(`${this.rootUrl}/EditVendor/${id}`, updateVendorRequest);
  }

  deleteVendor(id: any): Observable<any> {
    return this.http.post<any>(`${this.rootUrl}/DeleteVendor?id=${id}`, '');
  }
}
