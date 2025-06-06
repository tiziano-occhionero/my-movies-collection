import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RicercaService } from '../../services/ricerca.service';
import { CollezioneService } from '../../services/collezione.service';

@Component({
  selector: 'app-collezione',
  templateUrl: './collezione.component.html',
  styleUrls: ['./collezione.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class CollezioneComponent implements OnInit {
  tuttiIFilm: any[] = [];
  film: any[] = [];
  vista: 'galleria' | 'elenco' = 'galleria';
  query: string = '';
  ordinamento: string = 'alfabetico';
  messaggio: string = '';

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

  rimuoviDaCollezione(id: number): void {
    const conferma = confirm('Sei sicuro di voler rimuovere questo film dalla collezione?');
    if (!conferma) return;

    this.collezioneService.rimuoviFilm(id);
    this.tuttiIFilm = this.collezioneService.getCollezione();

    this.film = this.tuttiIFilm.filter(f =>
      f.title.toLowerCase().includes(this.query)
    );

    this.applicaOrdinamento();
    this.messaggio = 'Film rimosso dalla collezione.';

    setTimeout(() => this.messaggio = '', 3000);
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
    }
  }
}
