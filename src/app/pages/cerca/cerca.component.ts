import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RicercaService } from '../../services/ricerca.service';
import { CollezioneService } from '../../services/collezione.service';

@Component({
  selector: 'app-cerca',
  templateUrl: './cerca.component.html',
  styleUrls: ['./cerca.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class CercaComponent implements OnInit {
  tuttiIFilm: any[] = [];
  film: any[] = [];
  vista: 'galleria' | 'elenco' = 'galleria';  // valore iniziale
  query: string = '';
  ordinamento: string = 'alfabetico'; // esempio valore iniziale

  constructor(
    private collezioneService: CollezioneService,
    private ricercaService: RicercaService
  ) {}

  ngOnInit(): void {
    this.tuttiIFilm = this.collezioneService.getCollezione();
    this.film = [...this.tuttiIFilm];

    this.ricercaService.queryLocale$.subscribe((query: string) => {
    this.query = query.trim().toLowerCase();

      this.film = this.tuttiIFilm.filter(film =>
        film.title.toLowerCase().includes(this.query)
      );
      this.applicaOrdinamento();
    });
  }

  setVista(vista: 'galleria' | 'elenco'): void {
    this.vista = vista;
  }

  setOrdina(tipo: string): void {
    this.ordinamento = tipo;
    this.applicaOrdinamento();
  }

  private applicaOrdinamento(): void {
    switch (this.ordinamento) {
      case 'alfabetico':
        this.film.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'anno-crescente':
        this.film.sort((a, b) => (a.release_date || '').localeCompare(b.release_date || ''));
        break;
      case 'anno-decrescente':
        this.film.sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''));
        break;
      default:
        break;
    }
  }
}
