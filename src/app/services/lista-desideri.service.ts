import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Film } from '../models/film.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ListaDesideriService {
  // Nuova chiave + chiave legacy per compatibilità
  private storageKeyNew = 'listaDesideriFilm';
  private storageKeyLegacy = 'listaDesideri';

  // Rotte coerenti con il tuo FilmController
  private listUrl = `${environment.apiBaseUrl}/films/wishlist`;
  private postUrl = `${environment.apiBaseUrl}/films/wishlist`;
  private deleteBase = `${environment.apiBaseUrl}/films/wishlist`;

  constructor(private http: HttpClient) { }

  /** GET lista wishlist dal backend + salvataggio locale */
  getTuttiIFilm(): Observable<Film[]> {
    return this.http.get<Film[]>(this.listUrl).pipe(
      tap((films) => this.saveLocal(films ?? []))
    );
  }

  /** Lettura cache locale (nuova chiave, con fallback alla legacy) */
  getLocal(): Film[] {
    const datiNew = localStorage.getItem(this.storageKeyNew);
    if (datiNew) return JSON.parse(datiNew);
    const datiOld = localStorage.getItem(this.storageKeyLegacy);
    return datiOld ? JSON.parse(datiOld) : [];
  }

  /** Scrive l'intera lista in cache (usa entrambe le chiavi per compatibilità) */
  setLocal(list: Film[]): void {
    this.saveLocal(list);
  }

  /** POST crea in wishlist */
  aggiungiFilm(film: Film): Observable<Film> {
    return this.http.post<Film>(this.postUrl, film).pipe(
      tap((saved) => this.appendLocal(saved ?? film))
    );
  }

  /** POST crea in wishlist (film custom) */
  aggiungiFilmCustom(film: Film): Observable<Film> {
    const url = `${environment.apiBaseUrl}/films/custom`;
    return this.http.post<Film>(url, film).pipe(
      tap((saved) => this.appendLocal(saved ?? film))
    );
  }

  /** PUT aggiorna film custom in wishlist */
  aggiornaFilmCustom(film: Film): Observable<Film> {
    const url = `${environment.apiBaseUrl}/films/custom`;
    return this.http.put<Film>(url, film).pipe(
      tap((updated) => this.updateLocal(updated ?? film))
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
    const payload = JSON.stringify(films || []);
    // scrivi su entrambe le chiavi per migrazione dolce
    localStorage.setItem(this.storageKeyNew, payload);
    localStorage.setItem(this.storageKeyLegacy, payload);
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

  private updateLocal(film: Film): void {
    let curr = this.getLocal();
    const index = curr.findIndex(f => f.id === film.id);
    if (index > -1) {
      curr[index] = film;
      this.saveLocal(curr);
    }
  }
}
