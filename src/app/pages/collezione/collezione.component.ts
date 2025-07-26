import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RicercaService } from '../../services/ricerca.service';
import { CollezioneService } from '../../services/collezione.service';
import { HttpClient } from '@angular/common/http';
import { NetworkService } from '../../services/network.service';
import { Film } from '../../models/film.model';

@Component({
  selector: 'app-collezione',
  templateUrl: './collezione.component.html',
  styleUrls: ['./collezione.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class CollezioneComponent implements OnInit {
  tuttiIFilm: Film[] = [];
  film: Film[] = [];
  vista: 'galleria' | 'elenco' = 'galleria';
  query: string = '';
  ordinamento: string = 'alfabetico';
  messaggio: string = '';
  isOnline: boolean = true;
  queryCorrente: string = '';

  constructor(
    private collezioneService: CollezioneService,
    private ricercaService: RicercaService,
    private http: HttpClient,
    private networkService: NetworkService
  ) { }

  ngOnInit(): void {
    this.networkService.isOnline().subscribe(isOnline => {
      this.isOnline = isOnline;

      if (isOnline) {
        this.http.get<Film[]>('http://localhost:8080/api/films/collezione').subscribe({
          next: (dati) => {
            this.tuttiIFilm = dati;
            this.film = [...this.tuttiIFilm];
            this.applicaRicerca();
          },
          error: (err) => {
            console.error('Errore durante il caricamento dal backend:', err);
            this.caricaDaLocale();
          }
        });
      } else {
        this.caricaDaLocale();
      }
    });

    this.ricercaService.query$.subscribe((query: string) => {
      this.queryCorrente = query;
      this.query = query.toLowerCase();
      this.applicaRicerca();
    });
  }

  private caricaDaLocale(): void {
    this.tuttiIFilm = this.collezioneService.getCollezione();
    this.film = [...this.tuttiIFilm];
    this.applicaRicerca();
  }

  private applicaRicerca(): void {
    this.film = this.tuttiIFilm.filter(f =>
      f.titolo.toLowerCase().includes(this.query)
    );
    this.applicaOrdinamento();
  }

  setVista(vista: 'galleria' | 'elenco'): void {
    this.vista = vista;
  }

  setOrdina(tipo: string): void {
    this.ordinamento = tipo;
    this.applicaOrdinamento();
  }

  rimuoviDaCollezione(film: Film): void {
    const conferma = confirm('Sei sicuro di voler rimuovere questo film dalla collezione?');
    if (!conferma) return;

    if (this.isOnline) {
      this.collezioneService.rimuoviFilm(film.id).then(() => {
        // Ricarica i dati dal backend
        this.http.get<Film[]>('http://localhost:8080/api/films/collezione').subscribe({
          next: (dati) => {
            this.tuttiIFilm = dati;
            this.applicaRicerca();
            this.messaggio = 'Film rimosso dalla collezione.';
            setTimeout(() => this.messaggio = '', 3000);
          },
          error: (err) => {
            console.error('Errore durante il ricaricamento post-rimozione:', err);
          }
        });
      });
    } else {
      this.collezioneService.rimuoviFilm(film.id);
      this.tuttiIFilm = this.collezioneService.getCollezione();
      this.applicaRicerca();
      this.messaggio = 'Film rimosso dalla collezione.';
      setTimeout(() => this.messaggio = '', 3000);
    }
  }


  private applicaOrdinamento(): void {
    switch (this.ordinamento) {
      case 'alfabetico':
        this.film.sort((a, b) => a.titolo.localeCompare(b.titolo));
        break;
      case 'anno-crescente':
        this.film.sort((a, b) => a.anno - b.anno);
        break;
      case 'anno-decrescente':
        this.film.sort((a, b) => b.anno - a.anno);
        break;
    }
  }
}
