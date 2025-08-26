// src/app/interceptors/auth-interceptor.provider.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

const BACKEND_BASE = 'http://localhost:8080/';

export const authInterceptorFn: HttpInterceptorFn = (req, next) => {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'OPTIONS') return next(req);
  if (!req.url.startsWith(BACKEND_BASE)) return next(req);

  const auth = inject(AuthService);
  const creds = auth.getBasicCredentials();

  if (creds) {
    try {
      const user = atob(creds.replace(/^Basic\s+/i,'')).split(':')[0];
      console.log('[AUTH-INT] attach Authorization for', method, req.url, 'as', user);
    } catch {}
    return next(req.clone({ setHeaders: { Authorization: creds } }));
  }
  return next(req);
};
