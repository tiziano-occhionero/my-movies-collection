import { Component, ViewChild } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

import { RicercaService } from '../../services/ricerca.service';
import { TmdbService } from '../../services/tmdb.service';
import { AuthService } from '../../services/auth.service';

import { LoginModalComponent } from '../login-modal/login-modal.component';
import { LogoutModalComponent } from '../logout-modal/logout-modal.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule, LoginModalComponent, LogoutModalComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  query = '';

  // Modali gestite dalla navbar
  @ViewChild('loginRef') loginModal!: LoginModalComponent;
  @ViewChild('logoutRef') logoutModal!: LogoutModalComponent;

  constructor(
    private router: Router,
    private ricercaService: RicercaService,
    private tmdbService: TmdbService,
    public auth: AuthService
  ) {
    // svuota solo l’INPUT ad ogni cambio rotta (i filtri restano dove applicati)
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.query = '';
    });
  }

  // stato auth per la UI
  get loggedIn(): boolean { return this.auth.isLoggedIn(); }
  get username(): string | null { return this.auth.getLoggedUsername(); }

  // ---- Ricerca ----
  onSubmit() {
    const q = (this.query || '').trim();
    const url = this.router.url;

    if (!q) {
      this.clearSearch();
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

  // ---- Login/Logout gestiti dalla navbar ----
  apriLogin(): void {
    this.loginModal?.open();
  }
  onLoggedIn(e: { username: string; password: string }) {
    this.auth.login(e.username, e.password);
    this.loginModal?.close?.();
  }

  apriLogout(): void {
    this.logoutModal?.open();
  }
  confermaLogout(): void {
    this.auth.logout?.();
    // nessun alert qui: gli avvisi eventuali restano nelle pagine
  }

  // helper eventuali
  isInserimentoPage(): boolean { return this.router.url.includes('inserimento'); }
  isCercaPage(): boolean { return this.router.url.includes('cerca'); }
}
