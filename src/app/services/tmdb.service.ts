import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TmdbService {
  private apiKey = 'deebc21b32b0927766f6ec8dc6fa4b72'; // la tua chiave v3
  private baseUrl = 'https://api.themoviedb.org/3';

  constructor(private http: HttpClient) {}

  // 🔹 Nuovo metodo unico per cercare film, serie, persone
  cerca(query: string): Observable<any> {
    const url = `${this.baseUrl}/search/multi?api_key=${this.apiKey}&query=${encodeURIComponent(query)}&language=it-IT`;
    return this.http.get<any>(url);
  }

  // 🔹 Nuovo metodo dettagli (funziona per movie e tv)
  getDettagli(id: number, tipo: 'movie' | 'tv'): Observable<any> {
    const url = `${this.baseUrl}/${tipo}/${id}?api_key=${this.apiKey}&language=it-IT`;
    return this.http.get<any>(url);
  }

  // 🔹 Nuovo metodo crediti (funziona per movie e tv)
  getCrediti(id: number, tipo: 'movie' | 'tv'): Observable<any> {
    const url = `${this.baseUrl}/${tipo}/${id}/credits?api_key=${this.apiKey}&language=it-IT`;
    return this.http.get<any>(url);
  }

  // ✅ Wrapper per compatibilità col vecchio codice
  cercaFilm(query: string): Observable<any> {
    return this.cerca(query);
  }

  getDettagliFilm(id: number): Observable<any> {
    return this.getDettagli(id, 'movie');
  }

  getCreditiFilm(id: number): Observable<any> {
    return this.getCrediti(id, 'movie');
  }
}
