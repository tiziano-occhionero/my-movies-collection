import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private storageKey = 'mmc_basic_creds'; // MyMoviesCollection

  login(username: string, password: string) {
    const creds = 'Basic ' + btoa(`${username}:${password}`);
    localStorage.setItem(this.storageKey, creds);
  }

  logout() {
    localStorage.removeItem(this.storageKey);
  }

  getBasicCredentials(): string | null {
    return localStorage.getItem(this.storageKey);
  }

  isLoggedIn(): boolean {
    return !!this.getBasicCredentials();
  }

  getLoggedUsername(): string | null {
    const c = this.getBasicCredentials();
    if (!c) return null;
    try {
      return atob(c.replace(/^Basic\s+/i, '')).split(':')[0] || null;
    } catch {
      return null;
    }
  }



}
