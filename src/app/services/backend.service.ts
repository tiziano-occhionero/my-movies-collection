import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Film } from '../models/film.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BackendService {
  private baseUrl = `${environment.apiBaseUrl}/films`; // <- unica URL base

  constructor(private http: HttpClient) { }

  getCollezione(): Observable<Film[]> {
    return this.http.get<Film[]>(`${this.baseUrl}/collezione`);
  }

  aggiungiFilm(film: Film): Observable<Film> {
    return this.http.post<Film>(this.baseUrl, film);
  }

  rimuoviFilmDaCollezione(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/collezione/${id}`);
  }

  aggiornaProvenienza(id: string, nuovaProvenienza: string): Observable<Film> {
    return this.http.put<Film>(`${this.baseUrl}/${id}/provenienza`, nuovaProvenienza, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  salvaFilmInCollezione(film: Film): Observable<any> {
    return this.http.post(`${this.baseUrl}/collezione`, film);
  }
}
