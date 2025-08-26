import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Film } from '../models/film.model';

@Injectable({ providedIn: 'root' })
export class CollezioneService {
  // Offline fallback
  private storageKey = 'collezioneFilm';

  // Rotte coerenti con il tuo FilmController
  private listUrl = 'http://localhost:8080/api/films/collezione';
  private postUrl = 'http://localhost:8080/api/films/collezione';
  private deleteBase = 'http://localhost:8080/api/films/collezione';

  constructor(private http: HttpClient) {}

  /** GET lista collezione dal backend */
  getTuttiIFilm(): Observable<Film[]> {
    return this.http.get<Film[]>(this.listUrl);
  }

  /** Fallback locale usato quando offline */
  getCollezione(): Film[] {
    const dati = localStorage.getItem(this.storageKey);
    return dati ? JSON.parse(dati) : [];
  }

  /** POST crea in collezione (il backend forza provenienza=collezione) */
  aggiungiFilm(film: Film): Observable<Film> {
    return this.http.post<Film>(this.postUrl, film);
  }

  /** DELETE by id su /api/films/collezione/{id} */
  rimuoviFilm(id: string): Promise<void> {
    const url = `${this.deleteBase}/${encodeURIComponent(id)}`;
    console.log('[COLL-SVC] DELETE', url);
    return firstValueFrom(
      this.http.delete(url, { observe: 'response' }).pipe(
        map(() => void 0), // 200/204 → ok
        catchError((err: HttpErrorResponse) => {
          if (err.status === 404) {
            console.warn('[COLL-SVC] 404 (già rimosso):', id);
            return of(void 0); // trattiamo come successo
          }
          return throwError(() => err);
        })
      )
    );
  }
}
