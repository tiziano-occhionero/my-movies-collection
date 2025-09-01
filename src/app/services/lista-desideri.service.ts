import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Film } from '../models/film.model';

@Injectable({ providedIn: 'root' })
export class ListaDesideriService {
  // Chiave cache locale
  private storageKey = 'listaDesideriFilm';

  // Rotte coerenti con il tuo FilmController
  private listUrl = 'http://localhost:8080/api/films/wishlist';
  private postUrl = 'http://localhost:8080/api/films/wishlist';
  private deleteBase = 'http://localhost:8080/api/films/wishlist';

  constructor(private http: HttpClient) {}

  /** GET lista wishlist dal backend + salvataggio locale */
  getTuttiIFilm(): Observable<Film[]> {
    return this.http.get<Film[]>(this.listUrl).pipe(
      tap((films) => this.saveLocal(films ?? []))
    );
  }

  /** Lettura cache locale (usata offline) */
  getLocal(): Film[] {
    const dati = localStorage.getItem(this.storageKey);
    return dati ? JSON.parse(dati) : [];
  }

  /** POST crea in wishlist (il backend forza provenienza=wishlist) */
  aggiungiFilm(film: Film): Observable<Film> {
    return this.http.post<Film>(this.postUrl, film).pipe(
      tap((saved) => this.appendLocal(saved ?? film))
    );
  }

  /** DELETE by id su /api/films/wishlist/{id} */
  rimuoviFilm(id: string): Promise<void> {
    const url = `${this.deleteBase}/${encodeURIComponent(id)}`;
    return firstValueFrom(
      this.http.delete(url, { observe: 'response' }).pipe(
        tap(() => this.removeLocal(id)),
        map(() => void 0),
        catchError((err: HttpErrorResponse) => {
          if (err.status === 404) {
            this.removeLocal(id);
            return of(void 0);
          }
          return throwError(() => err);
        })
      )
    );
  }

  // ---------- Helpers cache locale ----------
  private saveLocal(films: Film[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(films || []));
  }

  private appendLocal(film: Film): void {
    const curr = this.getLocal();
    if (!curr.some(f => f.id === film.id)) {
      curr.push(film);
      this.saveLocal(curr);
    }
  }

  private removeLocal(id: string): void {
    const curr = this.getLocal().filter(f => f.id !== id);
    this.saveLocal(curr);
  }
}
