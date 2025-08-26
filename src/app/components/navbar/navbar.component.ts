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
    if (!q) {
      this.ricercaService.clear();
      this.ricercaService.setRicercaEffettuata(true);
      return;
    }

    // 1) esegui la ricerca su TMDB
    this.tmdbService.cercaFilm(q).subscribe({
      next: (res) => {
        const risultati = Array.isArray(res?.results) ? res.results : [];
        // 2) pubblica nei subject usati da InserimentoComponent
        this.ricercaService.setQueryLocale(q);
        this.ricercaService.setRisultatiApi(risultati);
        this.ricercaService.setRicercaEffettuata(true);

        // 3) se non sei su /inserimento, vai lì (è la pagina che mostra i risultati)
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
  }

  // opzionali se ti servono altrove
  isInserimentoPage(): boolean { return this.router.url.includes('inserimento'); }
  isCercaPage(): boolean { return this.router.url.includes('cerca'); }
}
