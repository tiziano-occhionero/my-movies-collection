import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TmdbService } from '../../services/tmdb.service';


@Component({
  selector: 'app-inserimento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inserimento.component.html',
})
export class InserimentoComponent {
  query: string = '';
  ultimaQuery: string = '';
  ricercaEffettuata: boolean = false;
  film: any[] = [];

  constructor(private tmdbService: TmdbService) {}

  cercaFilm(): void {
    const queryPulita = this.query.trim();
    this.ultimaQuery = queryPulita; // ✅ Salva la query effettiva cercata

    if (!queryPulita) {
      this.film = [];
      this.ricercaEffettuata = true;
      return;
    }

    this.tmdbService.cercaFilm(queryPulita).subscribe({
      next: (response) => {
        this.film = response.results;
        this.ricercaEffettuata = true;
      },
      error: (err) => {
        console.error('Errore nella chiamata TMDB', err);
        this.film = [];
        this.ricercaEffettuata = true;
      }
    });
  }
}
