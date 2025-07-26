import { Component, OnInit } from '@angular/core';
import { RicercaService } from '../../services/ricerca.service';
import { CommonModule } from '@angular/common';
import { CollezioneService } from '../../services/collezione.service';
import { TmdbService } from '../../services/tmdb.service';
import { FormsModule } from '@angular/forms';
import { Film } from '../../models/film.model';
import Modal from 'bootstrap/js/dist/modal';
import { ListaDesideriService } from '../../services/lista-desideri.service';

@Component({
  selector: 'app-inserimento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inserimento.component.html',
  styleUrls: ['./inserimento.component.scss']
})

export class InserimentoComponent implements OnInit {
  film: any[] = [];
  ricercaEffettuata: boolean = false;
  filmSelezionato: any = null;
  formatoSelezionato: Film['formato'] | '' = '';
  custodiaSelezionata: Film['custodia'] | '' = '';

  confermaSuccesso: boolean = false;

  constructor(
    private ricercaService: RicercaService,
    private collezioneService: CollezioneService,
    private tmdbService: TmdbService,
    private listaDesideriService: ListaDesideriService
  ) { }

  ngOnInit(): void {
    this.ricercaService.risultatiApi$.subscribe((risultati) => {
      this.film = risultati;
    });

    this.ricercaService.ricercaApiEffettuata$.subscribe((val) => {
      this.ricercaEffettuata = val;
    });
  }

  caricaDettagliFilm(film: any): void {
    if (film.dettagliCaricati) return;

    this.tmdbService.getDettagliFilm(film.id).subscribe(dettagli => {
      film.genre_names = dettagli.genres?.map((g: any) => g.name) || [];
    });

    this.tmdbService.getCreditiFilm(film.id).subscribe(crediti => {
      const regista = crediti.crew.find((m: any) => m.job === 'Director');
      const attoriPrincipali = crediti.cast.slice(0, 3);

      film.regista = regista ? regista.name : 'N/A';
      film.attori = attoriPrincipali.map((a: any) => a.name);
      film.dettagliCaricati = true;
    });
  }

  apriModale(film: any): void {
    this.filmSelezionato = film;
    this.formatoSelezionato = '';
    this.custodiaSelezionata = '';
    this.confermaSuccesso = false;

    const modalElement = document.getElementById('confermaAggiuntaModal');
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show();
    }
  }

  private resetForm(): void {
    setTimeout(() => {
      this.confermaSuccesso = false;
      this.formatoSelezionato = '';
      this.custodiaSelezionata = '';
      this.filmSelezionato = null;

      const modalElement = document.getElementById('confermaAggiuntaModal');
      if (modalElement) {
        const modal = Modal.getInstance(modalElement);
        modal?.hide();
      }
    }, 2000);
  }

  confermaAggiunta(): void {
    if (!this.filmSelezionato || !this.formatoSelezionato || !this.custodiaSelezionata) return;

    const filmSalvato: Film = {
      id: `${this.filmSelezionato.id}_${this.formatoSelezionato}_${this.custodiaSelezionata}`,
      tmdbId: this.filmSelezionato.id,
      titolo: this.filmSelezionato.title,
      anno: new Date(this.filmSelezionato.release_date).getFullYear(),
      posterPath: this.filmSelezionato.poster_path,
      formato: this.formatoSelezionato,
      custodia: this.custodiaSelezionata,
      provenienza: 'collezione'
    };


    this.collezioneService.aggiungiFilm(filmSalvato).subscribe({
      next: () => {
        this.confermaSuccesso = true;
        this.resetForm();
      },
      error: (err) => {
        console.error('Errore durante il salvataggio in collezione:', err);
      }
    });
  }

  aggiungiAllaListaDesideri(): void {
    if (!this.filmSelezionato || !this.formatoSelezionato || !this.custodiaSelezionata) return;

    const filmDaSalvare: Film = {
      id: `${this.filmSelezionato.id}_${this.formatoSelezionato}_${this.custodiaSelezionata}`,
      tmdbId: this.filmSelezionato.id,
      titolo: this.filmSelezionato.title,
      anno: new Date(this.filmSelezionato.release_date).getFullYear(),
      posterPath: this.filmSelezionato.poster_path,
      formato: this.formatoSelezionato,
      custodia: this.custodiaSelezionata,
      provenienza: 'lista-desideri'
    };

    this.listaDesideriService.aggiungiFilm(filmDaSalvare).subscribe({
      next: () => {
        this.confermaSuccesso = true;

        setTimeout(() => {
          this.confermaSuccesso = false;
          this.formatoSelezionato = '';
          this.custodiaSelezionata = '';
          this.filmSelezionato = null;

          const modalElement = document.getElementById('confermaAggiuntaModal');
          if (modalElement) {
            const modal = Modal.getInstance(modalElement);
            modal?.hide();
          }
        }, 2000);
      },
      error: (err) => {
        console.error('Errore durante il salvataggio su backend:', err);
      }
    });
  }
}
