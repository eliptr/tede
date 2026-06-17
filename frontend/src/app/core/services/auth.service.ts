import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs/operators';

export interface AuthUser {
  id: number;
  username: string;
  role: 'ADMIN' | 'ORGANIZER' | 'ATTENDEE';
  first_name: string;
  last_name: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = environment.apiUrl;
  currentUser = signal<AuthUser | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const stored = localStorage.getItem('user');
    if (stored) this.currentUser.set(JSON.parse(stored));
  }

  login(username: string, password: string) {
    return this.http.post<{ access_token: string; user: AuthUser }>(`${this.API}/auth/login`, { username, password })
      .pipe(tap((res) => {
        localStorage.setItem('token', res.access_token);
        localStorage.setItem('user', JSON.stringify(res.user));
        this.currentUser.set(res.user);
      }));
  }

  register(data: any) {
    return this.http.post(`${this.API}/auth/register`, data);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.router.navigate(['/']);
  }

  getToken() { return localStorage.getItem('token'); }

  isLoggedIn() { return !!this.currentUser(); }

  hasRole(...roles: string[]) {
    const u = this.currentUser();
    return u && roles.includes(u.role);
  }
}
