import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NgIf } from '@angular/common';
import { TmdbService } from '../../services/tmdb.service';
import { RicercaService } from '../../services/ricerca.service';
import { FormsModule } from '@angular/forms';

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
    private tmdbService: TmdbService,
    private ricercaService: RicercaService
  ) {}

  onSubmit() {
    const pagina = this.router.url;
    const query = this.query.trim();
    if (!query) return;
    if (pagina.includes('inserimento')) {
      this.tmdbService.cercaFilm(this.query).subscribe((res) => {
        this.ricercaService.setRisultatiApi(res.results);
      });
    } else if (pagina.includes('cerca')) {
      this.ricercaService.setQueryLocale(this.query);
    }
  }

  isInserimentoPage(): boolean {
    return this.router.url.includes('inserimento');
  }

  isCercaPage(): boolean {
    return this.router.url.includes('cerca');
  }
}
