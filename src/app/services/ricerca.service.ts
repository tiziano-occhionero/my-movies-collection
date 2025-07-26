import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RicercaService {
  // Per la ricerca API (pagina inserimento)
  private risultatiApiSource = new BehaviorSubject<any[]>([]);
  risultatiApi$ = this.risultatiApiSource.asObservable();

  // 🔽 NOVITÀ: indica se è stata effettuata una ricerca API
  private ricercaApiEffettuataSource = new BehaviorSubject<boolean>(false);
  ricercaApiEffettuata$ = this.ricercaApiEffettuataSource.asObservable();

  // Per la ricerca locale (pagina cerca)
  private queryLocaleSource = new BehaviorSubject<string>('');
  queryLocale$ = this.queryLocaleSource.asObservable();

  private querySubject = new BehaviorSubject<string>('');
  query$: Observable<string> = this.querySubject.asObservable();


  setRisultatiApi(risultati: any[]) {
    this.risultatiApiSource.next(risultati);
    this.ricercaApiEffettuataSource.next(true);  // 🔽 imposta flag ricerca effettuata
  }

  setQueryLocale(query: string) {
    this.queryLocaleSource.next(query);
  }

  // ✅ Metodo per leggere la query locale direttamente
  getQueryLocale(): string {
    return this.queryLocaleSource.value;
  }
}
