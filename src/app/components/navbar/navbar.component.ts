import { Component } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; // ⬅️ serve per *ngIf
import { filter } from 'rxjs/operators';

import { RicercaService } from '../../services/ricerca.service';
import { TmdbService } from '../../services/tmdb.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule], // ⬅️ aggiunto CommonModule
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  query = '';

  constructor(
    private router: Router,
    private ricercaService: RicercaService,
    private tmdbService: TmdbService
  ) {
    // svuota solo l’INPUT ad ogni cambio rotta (i filtri restano dove applicati)
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.query = '';
    });
  }

  onSubmit() {
    const q = (this.query || '').trim();
    const url = this.router.url;

    if (!q) {
      this.clearSearch(); // usa la stessa logica della X
      return;
    }

    if (url.includes('/inserimento')) {
      this.tmdbService.cercaFilm(q).subscribe({
        next: (res) => {
          const risultati = Array.isArray(res?.results) ? res.results : [];
          this.ricercaService.setQueryLocale(q);
          this.ricercaService.setRisultatiApi(risultati);
          this.ricercaService.setRicercaEffettuata(true);
          if (!this.router.url.includes('inserimento')) this.router.navigate(['/inserimento']);
        },
        error: (err) => {
          console.error('Errore TMDB:', err);
          this.ricercaService.setQueryLocale(q);
          this.ricercaService.setRisultatiApi([]);
          this.ricercaService.setRicercaEffettuata(true);
          if (!this.router.url.includes('inserimento')) this.router.navigate(['/inserimento']);
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

  // ✕ pulisce l’input e il filtro GIUSTO per la pagina corrente
  clearSearch() {
    this.query = '';
    const url = this.router.url;

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
  }

  isInserimentoPage(): boolean { return this.router.url.includes('inserimento'); }
  isCercaPage(): boolean { return this.router.url.includes('cerca'); }
}
