import { Injectable } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { TmdbService } from './tmdb.service';

@Injectable({ providedIn: 'root' })
export class RicercaService {
  // 🔎 Query corrente (in minuscolo per i filtri lato UI)
  private querySubject = new BehaviorSubject<string>('');
  query$ = this.querySubject.asObservable();

  // 📄 Risultati TMDB (solo array results)
  private risultatiApiSubject = new BehaviorSubject<any[]>([]);
  risultatiApi$ = this.risultatiApiSubject.asObservable();

  // ✅ Flag “ricerca effettuata”
  private ricercaApiEffettuataSubject = new BehaviorSubject<boolean>(false);
  ricercaApiEffettuata$ = this.ricercaApiEffettuataSubject.asObservable();

  constructor(private tmdb: TmdbService) {}

  /**
   * Flusso integrato: invoca TMDB e pubblica SOLO 'results'.
   */
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

  /**
   * Flusso “legacy”: consenti alla Navbar (o ad altri) di settare direttamente i risultati.
   * Emette anche ricercaEffettuata=true.
   */
  setRisultatiApi(results: any[]): void {
    const lista = Array.isArray(results) ? results : [];
    this.risultatiApiSubject.next(lista);
    this.ricercaApiEffettuataSubject.next(true);
  }

  /**
   * Flusso “legacy”: aggiorna solo la query locale (senza chiamare TMDB).
   */
  setQueryLocale(q: string): void {
    const s = (q || '').trim().toLowerCase();
    this.querySubject.next(s);
  }

  /**
   * Utility opzionali
   */
  clear(): void {
    this.querySubject.next('');
    this.risultatiApiSubject.next([]);
    this.ricercaApiEffettuataSubject.next(false);
  }

  setRicercaEffettuata(v: boolean): void {
    this.ricercaApiEffettuataSubject.next(!!v);
  }
}
