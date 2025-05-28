import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CollezioneService {
  private storageKey = 'collezioneFilm';

  constructor() {}

  getCollezione(): any[] {
    const dati = localStorage.getItem(this.storageKey);
    return dati ? JSON.parse(dati) : [];
  }

  aggiungiFilm(film: any): void {
    const collezione = this.getCollezione();
    const esiste = collezione.some(f => f.id === film.id);
    if (!esiste) {
      collezione.push(film);
      localStorage.setItem(this.storageKey, JSON.stringify(collezione));
    }
  }

  rimuoviFilm(id: number): void {
    const collezione = this.getCollezione().filter(f => f.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(collezione));
  }
}
