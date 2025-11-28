// src/app/services/health.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, Subscription, of } from 'rxjs';
import { catchError, switchMap, takeWhile, tap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HealthService {
  private awake$ = new BehaviorSubject<boolean>(false);
  private started = false;
  private sub?: Subscription;

  private pingUrl = `${environment.apiBaseUrl.replace(/\/$/, '')}/health/ping`;

  constructor(private http: HttpClient) {}

  /** Stream che indica se il backend è “sveglio” */
  isAwake$(): Observable<boolean> {
    return this.awake$.asObservable();
  }

  /** Avvia il ping finché non risponde OK, poi si ferma */
  start(): void {
    // il ping serve solo in produzione, per "svegliare" il backend
    if (this.started || !environment.production) {
      if (!environment.production) {
        // in locale, assumiamo sia sempre sveglio
        this.awake$.next(true);
      }
      return;
    }
    this.started = true;

    // prova subito una volta
    this.pingOnce().subscribe();

    // poi riprova ogni 2s finché non diventa true
    this.sub = interval(2000)
      .pipe(
        takeWhile(() => !this.awake$.value, true),
        switchMap(() => this.pingOnce())
      )
      .subscribe();
  }

  /** Un singolo ping che aggiorna awake$ e restituisce boolean */
  private pingOnce(): Observable<boolean> {
    return this.http.get(this.pingUrl, { responseType: 'text' }).pipe(
      map(() => true),                          // qualunque 2xx -> true
      tap((ok) => this.awake$.next(ok)),
      catchError(() => {
        this.awake$.next(false);
        return of(false);
      })
    );
  }
}
