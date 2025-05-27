import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RicercaService {
  // Per la ricerca API (pagina inserimento)
  private risultatiApiSource = new BehaviorSubject<any[]>([]);
  risultatiApi$ = this.risultatiApiSource.asObservable();

  // Per la ricerca locale (pagina cerca)
  private queryLocaleSource = new BehaviorSubject<string>('');
  queryLocale$ = this.queryLocaleSource.asObservable();

  setRisultatiApi(risultati: any[]) {
    this.risultatiApiSource.next(risultati);
  }

  setQueryLocale(query: string) {
    this.queryLocaleSource.next(query);
  }
}
