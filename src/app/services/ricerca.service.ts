import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

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

  setRisultatiApi(risultati: any[]) {
    this.risultatiApiSource.next(risultati);
    this.ricercaApiEffettuataSource.next(true);  // 🔽 imposta flag ricerca effettuata
  }

  setQueryLocale(query: string) {
    this.queryLocaleSource.next(query);
  }
}
