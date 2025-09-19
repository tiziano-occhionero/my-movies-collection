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

  @ViewChild('loginRef') loginModal!: LoginModalComponent;
  @ViewChild('logoutRef') logoutModal!: LogoutModalComponent;

  @ViewChild('navbarCollapse', { static: true }) navbarCollapse!: ElementRef<HTMLElement>;
  @ViewChild('navbarToggler', { static: true }) navbarToggler!: ElementRef<HTMLButtonElement>;
  private bsCollapse?: Collapse;

  menuOpen = false;
  private suppressClose = false;
  private suppressTimer?: any;

  // NUOVO: tieni traccia se la prossima navigazione è partita da un click nel menu aperto
  private keepMenuOpenOnNextNav = false;

  constructor(
    private router: Router,
    private ricercaService: RicercaService,
    private tmdbService: TmdbService,
    public auth: AuthService
  ) {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.query = '';

      if (window.innerWidth < 992) {
        if (this.keepMenuOpenOnNextNav && this.menuOpen) {
          // Mantieni il menu aperto dopo la navigazione
          this.keepMenuOpenOnNextNav = false;
          this.isHidden = false;
          this.startSuppressClose(400);
          this.bsCollapse?.show();
        } else {
          // Comportamento precedente: chiudi su cambio rotta (solo se non arrivi da click in menu)
          this.closeNavbarIfOpen();
        }
      }
    });
  }

  ngAfterViewInit(): void {
    const el = this.navbarCollapse.nativeElement;
    this.bsCollapse = Collapse.getOrCreateInstance(el, { toggle: false });

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

  // CLICK sulle voci del menu (HTML: (click)="onNavLinkClick('/path')")
  onNavLinkClick(_target: string): void {
    if (window.innerWidth < 992 && this.menuOpen) {
      this.keepMenuOpenOnNextNav = true;
    }
  }

  // Toggler manuale
  onTogglerClick(ev: MouseEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    if (!this.bsCollapse) return;

    if (this.menuOpen) {
      this.bsCollapse.hide();
    } else {
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

  apriLogin(): void { this.loginModal?.open(); }
  onLoggedIn(e: { username: string; password: string }) {
    this.auth.login(e.username, e.password);
    this.loginModal?.close?.();
  }
  apriLogout(): void { this.logoutModal?.open(); }
  confermaLogout(): void { this.auth.logout?.(); }

  isInserimentoPage(): boolean { return this.router.url.includes('inserimento'); }
  isCercaPage(): boolean { return this.router.url.includes('cerca'); }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const currentScroll = window.scrollY || document.documentElement.scrollTop;
    const delta = currentScroll - this.lastScrollTop;
    const absDelta = Math.abs(delta);

    if (this.menuOpen) {
      this.isHidden = false;
      if (!this.suppressClose && absDelta > 12) {
        this.closeNavbarIfOpen();
      }
      this.lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
      return;
    }

    if (currentScroll > this.lastScrollTop && currentScroll > 50) {
      this.isHidden = true;
    } else {
      this.isHidden = false;
    }

    this.lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
  }

  private closeNavbarIfOpen(): void {
    if (!this.bsCollapse) return;
    const el = this.navbarCollapse.nativeElement;
    const isShown = el.classList.contains('show');
    if (isShown) {
      this.bsCollapse.hide();
    }
  }
}
