import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { readToken } from './auth';

/** Attaches the JWT to /api calls and bounces to admin login on 401. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router); // must be injected in the interceptor's injection context (NG0203 otherwise)
  const token = readToken();
  let request = req;
  if (token && req.url.includes('/api/') && !req.url.includes('/auth/login')) {
    request = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(request).pipe(
    catchError((err: unknown) => {
      if (
        err instanceof HttpErrorResponse &&
        err.status === 401 &&
        req.url.includes('/api/') &&
        !req.url.includes('/auth/login') &&
        !req.url.endsWith('/auth/me')
      ) {
        localStorage.removeItem('portfolio.jwt');
        router.navigate(['/admin/login']);
      }
      return throwError(() => err);
    }),
  );
};
