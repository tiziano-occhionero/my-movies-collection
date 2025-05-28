// ⚠️ Non in uso attualmente. Potrebbe servire in futuro per logica avanzata di query o chiamate TMDB.

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FilmService {
  private querySubject = new BehaviorSubject<string>('');
  query$ = this.querySubject.asObservable();

  constructor() {}

  setQuery(value: string) {
    this.querySubject.next(value);
  }

  getQuery(): string {
    return this.querySubject.value;
  }

  // Simulazione futura per chiamate a TMDB
  cercaFilm() {
    const query = this.getQuery();
    console.log('Cerca film con query:', query);
    // TODO: chiamata HTTP
  }

  // 🔹 Metodo aggiunto per supportare la pagina Cerca
  getTuttiIFilm(): any[] {
    const dati = localStorage.getItem('filmLocali');
    return dati ? JSON.parse(dati) : [];
  }
}
