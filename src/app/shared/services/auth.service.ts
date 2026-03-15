import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private adminKey = 'AdminInfo';
  private expirationTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private adminInfoSubject = new BehaviorSubject<any>(this.getAdminInfo());

  // Observable for components to subscribe to
  adminInfo$ = this.adminInfoSubject.asObservable();

  setAdminInfo(value: any) {
    const adminData = {
      ...value,
      timestamp: new Date().getTime() // Add timestamp
    };
    localStorage.setItem(this.adminKey, JSON.stringify(adminData));
    this.adminInfoSubject.next(adminData);
  }

  getAdminInfo() {
    const storedAdminInfo = localStorage.getItem(this.adminKey);
    if (storedAdminInfo) {
      const adminData = JSON.parse(storedAdminInfo);
      const currentTime = new Date().getTime();

      // Check if the admin info has expired
      if (currentTime - adminData.timestamp > this.expirationTime) {
        this.deleteAdminInfo(); // Invalidate admin info
        return null;
      }
      return adminData;
    }
    return null;
  }

  updateAdminInfo(updatedData: any) {
    let currentAdminInfo = this.getAdminInfo();
    if (currentAdminInfo) {
      currentAdminInfo = { ...currentAdminInfo, ...updatedData, timestamp: new Date().getTime() }; // Update timestamp
      this.setAdminInfo(currentAdminInfo);
    }
  }

  deleteAdminInfo() {
    localStorage.removeItem(this.adminKey);
    this.adminInfoSubject.next(null);
    this.router.navigateByUrl('/admin-login');
  }
}
