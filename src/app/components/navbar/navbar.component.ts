import { Component, ViewChild, HostListener, ElementRef, AfterViewInit } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

import { RicercaService } from '../../services/ricerca.service';
import { TmdbService } from '../../services/tmdb.service';
import { AuthService } from '../../services/auth.service';

import { LoginModalComponent } from '../login-modal/login-modal.component';
import { LogoutModalComponent } from '../logout-modal/logout-modal.component';

// Bootstrap JS (per controllare il collapse da TS)
import Collapse from 'bootstrap/js/dist/collapse';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule, LoginModalComponent, LogoutModalComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements AfterViewInit {
  query = '';
  private lastScrollTop = 0;
  isHidden = false;

  // Modali gestite dalla navbar
  @ViewChild('loginRef') loginModal!: LoginModalComponent;
  @ViewChild('logoutRef') logoutModal!: LogoutModalComponent;

  // Riferimenti navbar
  @ViewChild('navbarCollapse', { static: true }) navbarCollapse!: ElementRef<HTMLElement>;
  @ViewChild('navbarToggler', { static: true }) navbarToggler!: ElementRef<HTMLButtonElement>;
  private bsCollapse?: Collapse;

  // Stato menu e soppressione (evita richiudersi subito per micro-scroll/shift)
  menuOpen = false;
  private suppressClose = false;
  private suppressTimer?: any;

  constructor(
    private router: Router,
    private ricercaService: RicercaService,
    private tmdbService: TmdbService,
    public auth: AuthService
  ) {
    // Svuota solo l’INPUT ad ogni cambio rotta (i filtri restano dove applicati)
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.query = '';
      // Chiudi il collapse al cambio rotta su mobile
      if (window.innerWidth < 992) this.closeNavbarIfOpen();
    });
  }

  // Inizializza Bootstrap Collapse e collega gli eventi
  ngAfterViewInit(): void {
    const el = this.navbarCollapse.nativeElement;
    this.bsCollapse = Collapse.getOrCreateInstance(el, { toggle: false });

    // Apertura: pin visibile, aggiorna stato + aria, sopprimi chiusure momentanee
    el.addEventListener('show.bs.collapse', () => {
      this.menuOpen = true;
      this.isHidden = false;
      this.updateAriaExpanded(true);
      this.startSuppressClose(400);
    });
    el.addEventListener('shown.bs.collapse', () => {
      this.menuOpen = true;
      this.isHidden = false;
      this.updateAriaExpanded(true);
      this.startSuppressClose(250);
    });

    // Chiusura: ripristina stato + aria
    el.addEventListener('hide.bs.collapse', () => {
      this.menuOpen = false;
      this.updateAriaExpanded(false);
      this.stopSuppressClose();
    });
    el.addEventListener('hidden.bs.collapse', () => {
      this.menuOpen = false;
      this.updateAriaExpanded(false);
      this.stopSuppressClose();
    });
  }

  // --- Toggle via bottone (niente data-bs-*) ---
  onTogglerClick(ev: MouseEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    if (!this.bsCollapse) return;

    if (this.menuOpen) {
      this.bsCollapse.hide();
    } else {
      // Evita che eventuali micro-shift richiudano subito
      this.startSuppressClose(400);
      this.bsCollapse.show();
    }
  }

  private updateAriaExpanded(expanded: boolean): void {
    try {
      this.navbarToggler?.nativeElement.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    } catch {}
  }

  private startSuppressClose(ms: number) {
    this.suppressClose = true;
    if (this.suppressTimer) clearTimeout(this.suppressTimer);
    this.suppressTimer = setTimeout(() => (this.suppressClose = false), ms);
  }
  private stopSuppressClose() {
    this.suppressClose = false;
    if (this.suppressTimer) {
      clearTimeout(this.suppressTimer);
      this.suppressTimer = undefined;
    }
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
  }

  // helper eventuali
  isInserimentoPage(): boolean { return this.router.url.includes('inserimento'); }
  isCercaPage(): boolean { return this.router.url.includes('cerca'); }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const currentScroll = window.scrollY || document.documentElement.scrollTop;
    const delta = currentScroll - this.lastScrollTop;
    const absDelta = Math.abs(delta);

    // Se il menu è aperto: pin visibile e chiudi al primo scroll "vero"
    if (this.menuOpen) {
      this.isHidden = false;
      if (!this.suppressClose && absDelta > 12) {
        this.closeNavbarIfOpen();
      }
      this.lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
      return;
    }

    // Menu chiuso: comportamento hide-on-scroll
    if (currentScroll > this.lastScrollTop && currentScroll > 50) {
      this.isHidden = true;
    } else {
      this.isHidden = false;
    }

    this.lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
  }

  // Chiude il collapse se risulta aperto
  private closeNavbarIfOpen(): void {
    if (!this.bsCollapse) return;
    const el = this.navbarCollapse.nativeElement;
    const isShown = el.classList.contains('show');
    if (isShown) {
      this.bsCollapse.hide();
    }
  }
}
