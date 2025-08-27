import { Injectable } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { TmdbService } from './tmdb.service';

@Injectable({ providedIn: 'root' })
export class RicercaService {
  // Query corrente per Inserimento
  private querySubject = new BehaviorSubject<string>('');
  query$ = this.querySubject.asObservable();

  // Query per Collezione
  private collezioneQuerySubject = new BehaviorSubject<string>('');
  collezioneQuery$ = this.collezioneQuerySubject.asObservable();

  // Query per Wishlist
  private wishlistQuerySubject = new BehaviorSubject<string>('');
  wishlistQuery$ = this.wishlistQuerySubject.asObservable();

  // Risultati TMDB per Inserimento
  private risultatiApiSubject = new BehaviorSubject<any[]>([]);
  risultatiApi$ = this.risultatiApiSubject.asObservable();

  // Flag per "ricerca effettuata"
  private ricercaApiEffettuataSubject = new BehaviorSubject<boolean>(false);
  ricercaApiEffettuata$ = this.ricercaApiEffettuataSubject.asObservable();

  constructor(private tmdb: TmdbService) {}

  // =============================
  // Inserimento
  // =============================
  cerca(query: string): void {
    const q = (query || '').trim();
    this.querySubject.next(q.toLowerCase());

    if (!q) {
      this.risultatiApiSubject.next([]);
      this.ricercaApiEffettuataSubject.next(true);
      return;
    }

    this.tmdb.cercaFilm(q).pipe(
      map((res: any) => Array.isArray(res?.results) ? res.results : []),
      tap(() => this.ricercaApiEffettuataSubject.next(true)),
      catchError(err => {
        console.error('Errore TMDB durante la ricerca:', err);
        this.ricercaApiEffettuataSubject.next(true);
        return of([] as any[]);
      })
    ).subscribe(lista => {
      this.risultatiApiSubject.next(lista);
    });
  }

  setRisultatiApi(results: any[]): void {
    this.risultatiApiSubject.next(Array.isArray(results) ? results : []);
    this.ricercaApiEffettuataSubject.next(true);
  }

  setQueryLocale(q: string): void {
    this.querySubject.next((q || '').trim().toLowerCase());
  }

  clear(): void {
    this.querySubject.next('');
    this.risultatiApiSubject.next([]);
    this.ricercaApiEffettuataSubject.next(false);
  }

  clearAll(): void {
    this.clear();
    this.clearCollezioneQuery();
    this.clearWishlistQuery();
  }

  setRicercaEffettuata(v: boolean): void {
    this.ricercaApiEffettuataSubject.next(!!v);
  }

  // =============================
  // Collezione
  // =============================
  setCollezioneQuery(q: string): void {
    this.collezioneQuerySubject.next((q || '').trim().toLowerCase());
  }

  clearCollezioneQuery(): void {
    this.collezioneQuerySubject.next('');
  }

  // =============================
  // Wishlist
  // =============================
  setWishlistQuery(q: string): void {
    this.wishlistQuerySubject.next((q || '').trim().toLowerCase());
  }

  clearWishlistQuery(): void {
    this.wishlistQuerySubject.next('');
  }
}
