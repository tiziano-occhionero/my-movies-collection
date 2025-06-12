import { Component, OnInit } from '@angular/core';
import { RicercaService } from '../../services/ricerca.service';
import { CommonModule } from '@angular/common';
import { CollezioneService } from '../../services/collezione.service';
import { TmdbService } from '../../services/tmdb.service';
import { FormsModule } from '@angular/forms';
import Modal from 'bootstrap/js/dist/modal';

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
  formatoSelezionato: string = '';
  custodiaSelezionata: string = '';
  confermaSuccesso: boolean = false;

  constructor(
    private ricercaService: RicercaService,
    private collezioneService: CollezioneService,
    private tmdbService: TmdbService
  ) {}

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

  confermaAggiunta() {
    if (!this.filmSelezionato || !this.formatoSelezionato || !this.custodiaSelezionata) {
      return;
    }

    const filmSalvato = {
      ...this.filmSelezionato,
      formato: this.formatoSelezionato,
      custodia: this.custodiaSelezionata
    };

    // ✅ Salvataggio tramite servizio corretto
    this.collezioneService.aggiungiFilm(filmSalvato);
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
  }

  aggiungiAllaListaDesideri(): void {
    if (!this.filmSelezionato || !this.formatoSelezionato || !this.custodiaSelezionata) return;

    const filmDaSalvare = {
      ...this.filmSelezionato,
      formato: this.formatoSelezionato,
      custodia: this.custodiaSelezionata
    };

    const lista = JSON.parse(localStorage.getItem('listaDesideri') || '[]');
    lista.push(filmDaSalvare);
    localStorage.setItem('listaDesideri', JSON.stringify(lista));

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
  }



}
