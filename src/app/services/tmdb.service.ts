import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TmdbService {
  private apiKey = 'deebc21b32b0927766f6ec8dc6fa4b72'; // la tua chiave v3
  private baseUrl = 'https://api.themoviedb.org/3';

  constructor(private http: HttpClient) {}

  cercaFilm(query: string): Observable<any> {
    const url = `${this.baseUrl}/search/movie?api_key=${this.apiKey}&query=${encodeURIComponent(query)}&language=it-IT`;
    return this.http.get<any>(url);
  }

  getDettagliFilm(id: number): Observable<any> {
    const url = `${this.baseUrl}/movie/${id}?api_key=${this.apiKey}&language=it-IT`;
    return this.http.get<any>(url);
  }

  getCreditiFilm(id: number): Observable<any> {
    const url = `${this.baseUrl}/movie/${id}/credits?api_key=${this.apiKey}&language=it-IT`;
    return this.http.get<any>(url);
  }
}
