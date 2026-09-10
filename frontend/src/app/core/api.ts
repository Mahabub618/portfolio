import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiEnvelope } from './models';

/** Unwraps the { data, error } envelope so features only ever see `data`. */
@Injectable({ providedIn: 'root' })
export class Api {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  get<T>(path: string, params?: Record<string, string | number | undefined>): Observable<T> {
    let httpParams = new HttpParams();
    for (const [k, v] of Object.entries(params ?? {})) {
      if (v !== undefined && v !== null && `${v}` !== '') httpParams = httpParams.set(k, `${v}`);
    }
    return this.http
      .get<ApiEnvelope<T>>(`${this.base}${path}`, { params: httpParams })
      .pipe(map((e) => e.data));
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .post<ApiEnvelope<T>>(`${this.base}${path}`, body)
      .pipe(map((e) => e.data));
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .put<ApiEnvelope<T>>(`${this.base}${path}`, body)
      .pipe(map((e) => e.data));
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .patch<ApiEnvelope<T>>(`${this.base}${path}`, body)
      .pipe(map((e) => e.data));
  }

  delete(path: string): Observable<void> {
    return this.http.delete<void>(`${this.base}${path}`);
  }
}
