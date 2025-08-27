import { Component } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';

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
  ) {
    // Reset automatico degli stati ricerca quando cambi pagina
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        const url: string = e?.urlAfterRedirects ?? e?.url ?? '';

        if (url.includes('/inserimento')) {
          // Stai entrando nella pagina dei risultati TMDB → pulisci filtri delle altre pagine
          this.ricercaService.clearCollezioneQuery();
          this.ricercaService.clearWishlistQuery();
        } else if (url.includes('/collezione')) {
          // Stai entrando in collezione → pulisci risultati TMDB e query wishlist
          this.ricercaService.clearInserimento();
          this.ricercaService.clearWishlistQuery();
        } else if (url.includes('/lista-desideri')) {
          // Stai entrando in wishlist → pulisci risultati TMDB e query collezione
          this.ricercaService.clearInserimento();
          this.ricercaService.clearCollezioneQuery();
        } else {
          // Pagina generica → pulisci tutto
          this.ricercaService.clearAll();
        }

        // UI: svuota la barra visiva quando NON sei su inserimento
        if (!url.includes('/inserimento')) {
          this.query = '';
        }
      });
  }

  onSubmit() {
    const q = (this.query || '').trim();
    const url = this.router.url;

    // Se il campo è vuoto → reset locale della pagina corrente
    if (!q) {
      if (url.includes('/inserimento')) {
        this.ricercaService.clearInserimento();
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

    // Instrada la ricerca in base alla pagina corrente
    if (url.includes('/inserimento')) {
      // Ricerca TMDB e mostra risultati su /inserimento
      this.tmdbService.cercaFilm(q).subscribe({
        next: (res) => {
          const risultati = Array.isArray(res?.results) ? res.results : [];
          this.ricercaService.setRisultatiApi(risultati);
          this.ricercaService.setRicercaEffettuata(true);
          if (!this.router.url.includes('inserimento')) {
            this.router.navigate(['/inserimento']);
          }
        },
        error: (err) => {
          console.error('Errore TMDB:', err);
          this.ricercaService.setRisultatiApi([]);
          this.ricercaService.setRicercaEffettuata(true);
          if (!this.router.url.includes('inserimento')) {
            this.router.navigate(['/inserimento']);
          }
        }
      });
    } else if (url.includes('/collezione')) {
      // Filtra localmente collezione
      this.ricercaService.setCollezioneQuery(q);
    } else if (url.includes('/lista-desideri')) {
      // Filtra localmente wishlist
      this.ricercaService.setWishlistQuery(q);
    } else {
      // Se cerchi da altrove, di default considera inserimento
      this.router.navigate(['/inserimento']).then(() => {
        this.onSubmit();
      });
    }
  }

  // opzionali
  isInserimentoPage(): boolean { return this.router.url.includes('inserimento'); }
  isCercaPage(): boolean { return this.router.url.includes('cerca'); }
}
