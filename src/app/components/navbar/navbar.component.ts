import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RicercaService } from '../../services/ricerca.service';
import { TmdbService } from '../../services/tmdb.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  query: string = '';

  constructor(
    private router: Router,
    private ricercaService: RicercaService,
    private tmdbService: TmdbService
  ) {}

  onSubmit() {
    const q = (this.query || '').trim();
    const url = this.router.url;

    if (!q) {
      if (url.includes('/inserimento')) {
        this.ricercaService.clear();
        this.ricercaService.setRicercaEffettuata(true);
      } else if (url.includes('/collezione')) {
        this.ricercaService.clearCollezioneQuery();
      } else if (url.includes('/lista-desideri')) {
        this.ricercaService.clearWishlistQuery();
      } else {
        this.ricercaService.clearAll();
      }
      return;
    }

    if (url.includes('/inserimento')) {
      this.tmdbService.cercaFilm(q).subscribe({
        next: (res) => {
          const risultati = Array.isArray(res?.results) ? res.results : [];
          this.ricercaService.setQueryLocale(q);
          this.ricercaService.setRisultatiApi(risultati);
          this.ricercaService.setRicercaEffettuata(true);

          if (!this.router.url.includes('inserimento')) {
            this.router.navigate(['/inserimento']);
          }
        },
        error: (err) => {
          console.error('Errore TMDB:', err);
          this.ricercaService.setQueryLocale(q);
          this.ricercaService.setRisultatiApi([]);
          this.ricercaService.setRicercaEffettuata(true);
          if (!this.router.url.includes('inserimento')) {
            this.router.navigate(['/inserimento']);
          }
        }
      });
    } else if (url.includes('/collezione')) {
      this.ricercaService.setCollezioneQuery(q);
    } else if (url.includes('/lista-desideri')) {
      this.ricercaService.setWishlistQuery(q);
    } else {
      this.router.navigate(['/inserimento']).then(() => this.onSubmit());
    }
  }

  isInserimentoPage(): boolean { return this.router.url.includes('inserimento'); }
  isCercaPage(): boolean { return this.router.url.includes('cerca'); }
}
