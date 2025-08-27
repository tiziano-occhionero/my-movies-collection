import { Injectable } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { TmdbService } from './tmdb.service';

@Injectable({ providedIn: 'root' })
export class RicercaService {
  // ===== Inserimento (TMDB) =====
  private risultatiApiSubject = new BehaviorSubject<any[]>([]);
  risultatiApi$ = this.risultatiApiSubject.asObservable();

  private ricercaApiEffettuataSubject = new BehaviorSubject<boolean>(false);
  ricercaApiEffettuata$ = this.ricercaApiEffettuataSubject.asObservable();

  // ===== Query locali per pagina =====
  private collezioneQuerySubject = new BehaviorSubject<string>('');
  collezioneQuery$ = this.collezioneQuerySubject.asObservable();

  private wishlistQuerySubject = new BehaviorSubject<string>('');
  wishlistQuery$ = this.wishlistQuerySubject.asObservable();

  constructor(private tmdb: TmdbService) {}

  // ====== INSERIMENTO (TMDB) ======
  cerca(query: string): void {
    const q = (query || '').trim();
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
    const lista = Array.isArray(results) ? results : [];
    this.risultatiApiSubject.next(lista);
    this.ricercaApiEffettuataSubject.next(true);
  }

  setRicercaEffettuata(v: boolean): void {
    this.ricercaApiEffettuataSubject.next(!!v);
  }

  // ====== COLLEZIONE / WISHLIST (local filters) ======
  setCollezioneQuery(q: string): void {
    this.collezioneQuerySubject.next((q || '').trim().toLowerCase());
  }

  clearCollezioneQuery(): void {
    this.collezioneQuerySubject.next('');
  }

  setWishlistQuery(q: string): void {
    this.wishlistQuerySubject.next((q || '').trim().toLowerCase());
  }

  clearWishlistQuery(): void {
    this.wishlistQuerySubject.next('');
  }

  // ====== Utility reset mirati ======
  clearInserimento(): void {
    this.risultatiApiSubject.next([]);
    this.ricercaApiEffettuataSubject.next(false);
  }

  clearAll(): void {
    this.clearInserimento();
    this.clearCollezioneQuery();
    this.clearWishlistQuery();
  }
}
