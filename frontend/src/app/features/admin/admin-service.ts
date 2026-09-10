import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Api } from '../../core/api';
import { ApiEnvelope, UploadResult } from '../../core/models';
import { asArray } from '../../core/services';

/** Write-side API surface for the admin panel (reads reuse core/services). */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly api = inject(Api);
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  /** Always resolves to a plain array, whether the endpoint paginates or not. */
  list<T>(path: string): Observable<T[]> {
    return this.api.get<unknown>(path).pipe(map((v) => asArray<T>(v)));
  }

  get<T>(path: string): Observable<T> {
    return this.api.get<T>(path);
  }

  create<T>(path: string, body: unknown): Observable<T> {
    return this.api.post<T>(path, body);
  }

  update<T>(path: string, body: unknown): Observable<T> {
    return this.api.put<T>(path, body);
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.api.patch<T>(path, body);
  }

  remove(path: string): Observable<void> {
    return this.api.delete(path);
  }

  /** Multipart upload (≤5 MB, jpg/png/webp/gif) — returns the served URL. */
  upload(file: File): Observable<UploadResult> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http
      .post<ApiEnvelope<UploadResult>>(`${this.base}/uploads`, fd)
      .pipe(map((e) => e.data));
  }
}
