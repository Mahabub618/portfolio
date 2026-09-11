import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Api } from './api';
import { LoginResponse } from './models';

const TOKEN_KEY = 'portfolio.jwt';

export function readToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/** True when a token exists and its exp claim is still in the future. */
export function hasValidToken(): boolean {
  const token = readToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(Api);
  private readonly router = inject(Router);

  private readonly _email = signal<string | null>(null);
  readonly email = this._email.asReadonly();
  readonly isAuthenticated = computed(() => this._email() !== null);

  constructor() {
    if (hasValidToken()) {
      try {
        const payload = JSON.parse(atob(readToken()!.split('.')[1]));
        this._email.set(payload.sub ?? 'admin');
      } catch {
        /* ignore malformed token; guard will redirect */
      }
    }
  }

  login(email: string, password: string) {
    return this.api.post<LoginResponse>('/auth/login', { email, password }).pipe(
      // tap-like side effect without extra import surface
    );
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.api.post<{ message: string }>('/auth/password', { currentPassword, newPassword });
  }

  completeLogin(res: LoginResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    this._email.set(res.user.email);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this._email.set(null);
    this.router.navigate(['/admin/login']);
  }
}
