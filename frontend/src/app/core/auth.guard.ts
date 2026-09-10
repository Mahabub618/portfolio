import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { hasValidToken } from './auth';

export const authGuard: CanActivateFn = () => {
  if (hasValidToken()) return true;
  return inject(Router).createUrlTree(['/admin/login']);
};
