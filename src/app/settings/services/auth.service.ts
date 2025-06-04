import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js'; // npm install crypto-js @types/crypto-js

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private memoryCache: any = null;
  private storageKey = '*_*';
  private encryptionKey = 'your-dynamic-key'; // In production, fetch from API/backend

  constructor() {
    // Restore from secure storage on service init
    // this.restoreUser();

    // Backup to secure storage before page unload
    window.addEventListener('beforeunload', () => this.deleteUser());      // todo: this.backupUser()
  }

  setUser(user: any) {
    this.memoryCache = user;
    this.backupUser(); // Optional: Persist immediately
  }

  getUser() {
    return this.memoryCache;
  }

  deleteUser() {
    this.memoryCache = null;
    localStorage.removeItem(this.storageKey);
  }

  private backupUser() {
    if (this.memoryCache) {
      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(this.memoryCache),
        this.encryptionKey
      ).toString();
      localStorage.setItem(this.storageKey, encrypted);
    }
  }

  private restoreUser() {
    const encrypted = localStorage.getItem(this.storageKey);
    if (encrypted) {
      try {
        const decrypted = CryptoJS.AES.decrypt(
          encrypted,
          this.encryptionKey
        ).toString(CryptoJS.enc.Utf8);
        this.memoryCache = JSON.parse(decrypted);
      } catch (e) {
        this.deleteUser(); // Clear corrupted data
      }
    }
  }
}



// import { Injectable } from '@angular/core';

// @Injectable({
//   providedIn: 'root'
// })
// export class AuthService {

//   private localStorageKey = 'hmsUser';

//   constructor() {
//     // Add event listener for when the window/tab is closed
//     window.addEventListener('beforeunload', () => this.deleteUser());
//   }

//   setUser(user: any) {

//     // Save user to local storage
//     localStorage.setItem(this.localStorageKey, JSON.stringify(user));
//   }

//   getUser() {
//     // Retrieve user from local storage
//     const storedUser = localStorage.getItem(this.localStorageKey);
//     return storedUser ? JSON.parse(storedUser) : null;
//   }

//   deleteUser() {
//     // Remove user from local storage
//     localStorage.removeItem(this.localStorageKey);
//   }
// }

