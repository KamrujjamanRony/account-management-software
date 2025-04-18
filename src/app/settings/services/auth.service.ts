import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private localStorageKey = 'hmsUser';

  // constructor() {
  //   window.addEventListener('beforeunload', () => this.deleteUser());
  // }

  setUser(user: any) {

    // Save user to local storage
    localStorage.setItem(this.localStorageKey, JSON.stringify(user));
  }

  getUser() {
    // Retrieve user from local storage
    const storedUser = localStorage.getItem(this.localStorageKey);
    return storedUser ? JSON.parse(storedUser) : null;
  }

  deleteUser() {
    // Remove user from local storage
    localStorage.removeItem(this.localStorageKey);
  }
}
