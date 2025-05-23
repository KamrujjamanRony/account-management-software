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

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private localStorageKey = '*-*';
  private encryptionKey = 'your-secure-encryption-key'; // In production, use a more secure way to store this

  constructor() {
    window.addEventListener('beforeunload', () => this.deleteUser());
  }

  async setUser(user: any) {
    try {
      const encryptedUser = await this.encryptData(JSON.stringify(user));
      localStorage.setItem(this.localStorageKey, encryptedUser);
    } catch (error) {
      console.error('Encryption failed:', error);
      // Fallback to unencrypted storage if encryption fails
      localStorage.setItem(this.localStorageKey, JSON.stringify(user));
    }
  }

  async getUser() {
    const storedData = localStorage.getItem(this.localStorageKey);
    if (!storedData) return null;

    try {
      // Try to decrypt first (assuming it's encrypted)
      const decryptedData = await this.decryptData(storedData);
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error('Decryption failed, trying plain JSON:', error);
      // Fallback to plain JSON parsing if decryption fails
      try {
        return JSON.parse(storedData);
      } catch (e) {
        console.error('Failed to parse user data:', e);
        this.deleteUser();
        return null;
      }
    }
  }

  deleteUser() {
    localStorage.removeItem(this.localStorageKey);
  }

  // Encryption/Decryption using Web Crypto API
  private async encryptData(data: string): Promise<string> {
    if (!window.crypto || !window.crypto.subtle) {
      return this.simpleEncrypt(data); // Fallback for browsers without Web Crypto API
    }

    try {
      // In a real app, you would want to use a more secure key derivation method
      const encoder = new TextEncoder();
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(this.encryptionKey),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );

      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const key = await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        encoder.encode(data)
      );

      // Combine salt, iv, and encrypted data for storage
      const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(encrypted), salt.length + iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Web Crypto encryption failed:', error);
      throw error;
    }
  }

  private async decryptData(encryptedData: string): Promise<string> {
    if (!window.crypto || !window.crypto.subtle) {
      return this.simpleDecrypt(encryptedData); // Fallback for browsers without Web Crypto API
    }

    try {
      const decoder = new TextDecoder();
      const encryptedArray = new Uint8Array(
        atob(encryptedData)
          .split('')
          .map(char => char.charCodeAt(0))
      );

      const salt = encryptedArray.slice(0, 16);
      const iv = encryptedArray.slice(16, 28);
      const data = encryptedArray.slice(28);

      const encoder = new TextEncoder();
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(this.encryptionKey),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );

      const key = await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        data
      );

      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Web Crypto decryption failed:', error);
      throw error;
    }
  }

  // Simple fallback encryption (less secure)
  private simpleEncrypt(data: string): string {
    // This is a simple XOR encryption - not cryptographically secure!
    let result = '';
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(data.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length));
    }
    return btoa(result);
  }

  private simpleDecrypt(encryptedData: string): string {
    try {
      const decoded = atob(encryptedData);
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length));
      }
      return result;
    } catch (error) {
      console.error('Simple decryption failed:', error);
      throw error;
    }
  }
}