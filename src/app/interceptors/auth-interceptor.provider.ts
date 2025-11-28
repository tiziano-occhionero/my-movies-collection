// src/app/interceptors/auth-interceptor.provider.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

// normalizza: niente slash finale
const API_BASE = environment.apiBaseUrl.replace(/\/$/, '');

export const authInterceptorFn: HttpInterceptorFn = (req, next) => {
  const method = req.method.toUpperCase();

  // IMPORTANTISSIMO: niente Authorization su OPTIONS
  if (method === 'OPTIONS') {
    return next(req);
  }

  // applichiamo auth solo alle nostre API
  if (!req.url.startsWith(API_BASE)) return next(req);

  const auth = inject(AuthService);
  const creds = auth.getBasicCredentials(); // "Basic xxx..."
  if (!creds) return next(req);

  return next(req.clone({ setHeaders: { Authorization: creds } }));
};
