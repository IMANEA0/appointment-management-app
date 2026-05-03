import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly api = 'http://localhost:3000';

  private readonly tokenKey = 'auth_token';
  private readonly nameKey = 'auth_name';
  private readonly emailKey = 'auth_email';

  constructor(private http: HttpClient) {}

  login(data: { email: string; password: string }): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.api}/login`, data);
  }

  register(data: { name?: string; email: string; password: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.api}/register`, data);
  }

  setSession(token: string, email?: string) {
    localStorage.setItem(this.tokenKey, token);
    if (email) {
      const existingEmail = localStorage.getItem(this.emailKey);
      if (existingEmail && existingEmail !== email) {
        // Avoid showing the previous user's name if emails change.
        localStorage.removeItem(this.nameKey);
      }
      localStorage.setItem(this.emailKey, email);
    }
  }

  setProfile(profile: { name?: string; email?: string }) {
    if (profile.name) localStorage.setItem(this.nameKey, profile.name);
    if (profile.email) localStorage.setItem(this.emailKey, profile.email);
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.nameKey);
    localStorage.removeItem(this.emailKey);
  }

  isLoggedIn(): boolean {
    return !!this.token;
  }

  get token(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  get email(): string | null {
    return localStorage.getItem(this.emailKey);
  }

  get name(): string | null {
    return localStorage.getItem(this.nameKey);
  }

  get displayName(): string {
    const storedName = this.name?.trim();
    if (storedName) return storedName;

    const storedEmail = this.email?.trim();
    if (storedEmail) return storedEmail.split('@')[0] || storedEmail;

    return 'user';
  }
}
