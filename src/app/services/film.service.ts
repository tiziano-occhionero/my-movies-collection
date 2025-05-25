import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FilmService {

  constructor() { }

  private querySubject = new BehaviorSubject<string>('');
  query$ = this.querySubject.asObservable();

  setQuery(value: string) {
    this.querySubject.next(value);
  }

  getQuery(): string {
    return this.querySubject.value;
  }

  // In futuro: qui aggiungeremo chiamate a TMDB
  cercaFilm() {
    const query = this.getQuery();
    console.log('Cerca film con query:', query);
    // TODO: chiamata HTTP
  }

}
