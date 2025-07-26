import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Film } from '../models/film.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ListaDesideriService {
  private apiUrl = 'http://localhost:8080/api/films/wishlist';

  constructor(private http: HttpClient) { }

  aggiungiFilm(film: Film): Observable<Film> {
    return this.http.post<Film>(this.apiUrl, film);
  }

  getTuttiIFilm(): Observable<Film[]> {
    return this.http.get<Film[]>(this.apiUrl);
  }

  rimuoviFilm(id: string): Promise<void> {
    return this.http.delete(`${this.apiUrl}/${id}`).toPromise().then(() => { });
  }

}

