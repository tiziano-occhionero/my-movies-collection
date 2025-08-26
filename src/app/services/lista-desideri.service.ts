import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Film } from '../models/film.model';

@Injectable({ providedIn: 'root' })
export class ListaDesideriService {
  // Rotte coerenti con il tuo FilmController
  private listUrl = 'http://localhost:8080/api/films/wishlist';
  private postUrl = 'http://localhost:8080/api/films/wishlist';
  private deleteBase = 'http://localhost:8080/api/films/wishlist';

  constructor(private http: HttpClient) {}

  /** GET lista wishlist dal backend */
  getTuttiIFilm(): Observable<Film[]> {
    return this.http.get<Film[]>(this.listUrl);
  }

  /** POST crea in wishlist (il backend forza provenienza=wishlist) */
  aggiungiFilm(film: Film): Observable<Film> {
    return this.http.post<Film>(this.postUrl, film);
  }

  /** DELETE by id su /api/films/wishlist/{id} */
  rimuoviFilm(id: string): Promise<void> {
    const url = `${this.deleteBase}/${encodeURIComponent(id)}`;
    console.log('[WISHLIST-SVC] DELETE', url);
    return firstValueFrom(
      this.http.delete(url, { observe: 'response' }).pipe(
        map(() => void 0),
        catchError((err: HttpErrorResponse) => {
          if (err.status === 404) {
            console.warn('[WISHLIST-SVC] 404 (già rimosso):', id);
            return of(void 0);
          }
          return throwError(() => err);
        })
      )
    );
  }
}
