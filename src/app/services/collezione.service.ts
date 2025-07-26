import { Injectable } from '@angular/core';
import { Film } from '../models/film.model';
import { BackendService } from './backend.service';
import { NetworkService } from './network.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CollezioneService {
  private storageKey = 'collezioneFilm';
  private collezione: Film[] = [];
  private apiUrl = 'http://localhost:8080/api/films/collezione';

  constructor(
    private backendService: BackendService,
    private networkService: NetworkService,
    private http: HttpClient,
  ) { }

  getCollezione(): Film[] {
    const dati = localStorage.getItem(this.storageKey);
    this.collezione = dati ? JSON.parse(dati) : [];
    return this.collezione;
  }

  aggiungiFilm(film: Film): Observable<Film> {
    return this.http.post<Film>(this.apiUrl, film);
  }

  async rimuoviFilm(id: string): Promise<void> {
    if (!this.networkService.getCurrentStatus()) {
      console.warn('Operazione non disponibile offline');
      return;
    }

    // Chiamata corretta: trasformiamo l'observable in Promise
    await this.backendService.rimuoviFilmDaCollezione(id).toPromise();

    this.collezione = this.collezione.filter(f => f.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(this.collezione));
  }


}
