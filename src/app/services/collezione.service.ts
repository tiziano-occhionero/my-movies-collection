import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Film } from '../models/film.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CollezioneService {
  // Chiave cache locale
  private storageKey = 'collezioneFilm';

  // Rotte coerenti con il tuo FilmController
  private listUrl = `${environment.apiBaseUrl}/films/collezione`;
  private postUrl = `${environment.apiBaseUrl}/films/collezione`;
  private deleteBase = `${environment.apiBaseUrl}/films/collezione`;

  constructor(private http: HttpClient) { }

  /** GET lista collezione dal backend + salvataggio locale */
  getTuttiIFilm(): Observable<Film[]> {
    return this.http.get<Film[]>(this.listUrl).pipe(
      tap((films) => this.saveLocal(films ?? []))
    );
  }

  /** Lettura cache locale (usata offline) */
  getCollezione(): Film[] {
    const dati = localStorage.getItem(this.storageKey);
    return dati ? JSON.parse(dati) : [];
  }

  /** POST crea in collezione (il backend forza provenienza=collezione) */
  aggiungiFilm(film: Film): Observable<Film> {
    return this.http.post<Film>(this.postUrl, film).pipe(
      tap((saved) => this.appendLocal(saved ?? film))
    );
  }

  /** POST crea in collezione (film custom) */
  aggiungiFilmCustom(film: Film): Observable<Film> {
    const url = `${environment.apiBaseUrl}/films/custom`;
    return this.http.post<Film>(url, film).pipe(
      tap((saved) => this.appendLocal(saved ?? film))
    );
  }

  /** PUT aggiorna film custom in collezione */
  aggiornaFilmCustom(film: Film): Observable<Film> {
    const url = `${environment.apiBaseUrl}/films/custom`;
    return this.http.put<Film>(url, film).pipe(
      tap((updated) => this.updateLocal(updated ?? film))
    );
  }

  /** PUT aggiorna film in collezione */
  updateFilm(film: Film): Observable<Film> {
    const url = `${environment.apiBaseUrl}/films/${encodeURIComponent(film.id)}`;
    return this.http.put<Film>(url, film).pipe(
      tap((updated) => this.updateLocal(updated ?? film))
    );
  }

  /** DELETE by id su /api/films/collezione/{id} */
  rimuoviFilm(id: string): Promise<void> {
    const url = `${this.deleteBase}/${encodeURIComponent(id)}`;
    return firstValueFrom(
      this.http.delete(url, { observe: 'response' }).pipe(
        tap(() => this.removeLocal(id)),
        map(() => void 0), // 200/204 → ok
        catchError((err: HttpErrorResponse) => {
          if (err.status === 404) {
            // backend dice che già non esiste → allinea cache locale
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
    const curr = this.getCollezione();
    // evita duplicati sulla stessa id
    if (!curr.some(f => f.id === film.id)) {
      curr.push(film);
      this.saveLocal(curr);
    }
  }

  private removeLocal(id: string): void {
    const curr = this.getCollezione().filter(f => f.id !== id);
    this.saveLocal(curr);
  }

  private updateLocal(film: Film): void {
    let curr = this.getCollezione();
    const index = curr.findIndex(f => f.id === film.id);
    if (index > -1) {
      curr[index] = film;
      this.saveLocal(curr);
    }
  }
}
