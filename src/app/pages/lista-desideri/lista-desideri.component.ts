import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RicercaService } from '../../services/ricerca.service';
import { CollezioneService } from '../../services/collezione.service';

@Component({
  selector: 'app-lista-desideri',
  templateUrl: './lista-desideri.component.html',
  styleUrls: ['./lista-desideri.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ListaDesideriComponent implements OnInit {
  listaDesideri: any[] = [];
  vista: 'galleria' | 'elenco' = 'galleria';
  query: string = '';
  ordinamento: string = 'alfabetico';

  constructor(
    private collezioneService: CollezioneService,
    private ricercaService: RicercaService
  ) {}

  ngOnInit(): void {
    const data = localStorage.getItem('listaDesideri');
    this.listaDesideri = data ? JSON.parse(data) : [];
    this.applicaOrdinamento();
  }

  elimina(index: number): void {
    this.listaDesideri.splice(index, 1);
    localStorage.setItem('listaDesideri', JSON.stringify(this.listaDesideri));
  }

  aggiungiAllaCollezione(film: any): void {
    this.collezioneService.aggiungiFilm(film);   // ✅ Usa il servizio centralizzato
    this.elimina(film);                          // ✅ Rimuove dalla lista desideri
  }

  applicaOrdinamento(): void {
    switch (this.ordinamento) {
      case 'alfabetico':
        this.listaDesideri.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'anno-crescente':
        this.listaDesideri.sort((a, b) => (a.release_date || '').localeCompare(b.release_date || ''));
        break;
      case 'anno-decrescente':
        this.listaDesideri.sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''));
        break;
    }
  }
}
