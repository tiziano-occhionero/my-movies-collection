import { Component, OnInit, ViewChild, HostListener, AfterViewInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { RicercaService } from '../../services/ricerca.service';
import { CollezioneService } from '../../services/collezione.service';
import { NetworkService } from '../../services/network.service';
import { AuthService } from '../../services/auth.service';

import { Film } from '../../models/film.model';
import { LoginModalComponent } from '../../components/login-modal/login-modal.component';
import Modal from 'bootstrap/js/dist/modal';
import Dropdown from 'bootstrap/js/dist/dropdown';
import { LogoutModalComponent } from '../../components/logout-modal/logout-modal.component';
import { CustomMovieModalComponent } from '../../components/custom-movie-modal/custom-movie-modal.component';
import { HealthService } from '../../services/health.service';

@Component({
  selector: 'app-collezione',
  templateUrl: './collezione.component.html',
  styleUrls: ['./collezione.component.scss'],
  standalone: true,
  imports: [CommonModule, LoginModalComponent, LogoutModalComponent, CustomMovieModalComponent]
})
export class CollezioneComponent implements OnInit, AfterViewInit {
  @ViewChild('loginRef') loginModal!: LoginModalComponent;
  @ViewChild('logoutRef') logoutModal!: LogoutModalComponent;
  @ViewChild('customMovieRef') customMovieModal!: CustomMovieModalComponent;

  tuttiIFilm: Film[] = [];
  film: Film[] = [];
  vista: 'galleria' | 'elenco' = 'galleria';
  lastVistaOnline: 'galleria' | 'elenco' = 'galleria';

  query: string = '';
  ordinamento: string = 'alfabetico';
  messaggio: string = '';
  isOnline: boolean = true;
  queryCorrente: string = '';
  isLoading = false;

  // Stato bottone "torna su"
  isScrollButtonVisible = false;

  // avvisi
  noPermessiMsg: string = '';
  loadErrorMsg: string = '';

  // stato rimozione
  selectedForDelete: Film | null = null;
  isDeleting = false;

  // azione pendente post-login
  private pendingAfterLogin: { action: 'delete'; film: Film } | null = null;

  // Backend awake
  isBackendAwake = false;
  get onlineEffettivo(): boolean { return this.isOnline && this.isBackendAwake; }

  constructor(
    private collezioneService: CollezioneService,
    private ricercaService: RicercaService,
    private networkService: NetworkService,
    public auth: AuthService,
    private health: HealthService,
    private elementRef: ElementRef
  ) { }

  ngOnInit(): void {
    // Sveglia Render e osserva lo stato backend
    this.health.start();
    this.health.isAwake$().subscribe((ok: boolean) => {
      const prima = this.isBackendAwake;
      this.isBackendAwake = ok;
      if (!prima && ok && this.isOnline) {
        this.vista = this.lastVistaOnline;
        this.caricaDaBackend();
      }
    });


    // Stato rete
    this.networkService.isOnline().subscribe(isOnline => {
      this.isOnline = isOnline;

      if (this.onlineEffettivo) {
        // online + backend sveglio → ripristina vista e ricarica
        this.vista = this.lastVistaOnline;
        this.caricaDaBackend();
      } else {
        // offline (rete o backend) → ricorda vista e forza elenco + locale
        this.lastVistaOnline = this.vista;
        this.vista = 'elenco';
        this.caricaDaLocale();
      }
    });

    // Ricerca
    this.ricercaService.collezioneQuery$.subscribe((query: string) => {
      this.queryCorrente = query;
      this.query = query.toLowerCase();
      this.applicaRicerca();
    });
  }

  ngAfterViewInit(): void {
    // Inizializza i dropdown di Bootstrap
    const dropdownElementList = [].slice.call(this.elementRef.nativeElement.querySelectorAll('[data-bs-toggle="dropdown"]'));
    dropdownElementList.map((dropdownToggleEl: any) => {
      return new Dropdown(dropdownToggleEl);
    });
  }

  get loggedIn(): boolean { return this.auth.isLoggedIn(); }
  get username(): string | null { return this.auth.getLoggedUsername(); }

  // ---------- Login helpers ----------
  private openLoginModalSafely(): void {
    const openModalEl = document.querySelector('.modal.show') as HTMLElement | null;
    if (openModalEl) {
      const inst = Modal.getInstance(openModalEl) || new Modal(openModalEl);
      inst.hide();
    }
    setTimeout(() => this.loginModal?.open(), 200);
  }

  private openLoginRequired(): void {
    const el = document.getElementById('loginRequiredModal');
    if (el) new Modal(el).show();
  }
  private closeLoginRequired(): void {
    const el = document.getElementById('loginRequiredModal');
    if (!el) return;
    const inst = Modal.getInstance(el) || new Modal(el);
    inst.hide();
  }

  procediAlLogin(): void {
    this.closeLoginRequired();
    this.openLoginModalSafely();
  }

  apriLogin(): void {
    const openModalEl = document.querySelector('.modal.show') as HTMLElement | null;
    if (openModalEl) {
      const instance = Modal.getInstance(openModalEl) || new Modal(openModalEl);
      instance.hide();
    }
    setTimeout(() => this.loginModal?.open(), 250);
  }

  onLoggedIn(e: { username: string; password: string }) {
    this.auth.login(e.username, e.password);
    this.loginModal?.close?.();

    if (this.pendingAfterLogin?.action === 'delete' && this.pendingAfterLogin.film) {
      this.selectedForDelete = this.pendingAfterLogin.film;
      this.pendingAfterLogin = null;
      this.apriConfermaDelete();
    }
  }

  confermaLogout(): void {
    this.auth.logout();
    this.messaggio = 'Hai effettuato il logout.';
    setTimeout(() => this.messaggio = '', 3000);
  }

  // ---------- Data load ----------
  private caricaDaBackend(): void {
    this.isLoading = true;
    const snapshot = [...this.tuttiIFilm];
    this.loadErrorMsg = '';

    this.collezioneService.getTuttiIFilm().subscribe({
      next: (dati) => {
        this.tuttiIFilm = dati ?? [];
        this.film = [...this.tuttiIFilm];
        this.applicaRicerca();
      },
      error: (err: HttpErrorResponse) => {
        console.error('GET collezione fallito:', err);
        this.tuttiIFilm = snapshot;
        this.film = [...this.tuttiIFilm];
        this.applicaRicerca();
        this.loadErrorMsg = `Impossibile aggiornare dalla rete (status ${err.status || 'n/d'}). Mostro i dati già caricati.`;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  private caricaDaLocale(): void {
    this.tuttiIFilm = this.collezioneService.getCollezione();
    this.film = [...this.tuttiIFilm];
    this.applicaRicerca();
  }

  private applicaRicerca(): void {
    this.film = this.tuttiIFilm.filter(f =>
      f.titolo.toLowerCase().includes(this.query)
    );
    this.applicaOrdinamento();
  }

  setVista(vista: 'galleria' | 'elenco'): void {
    if (!this.onlineEffettivo) return; // offline “effettivo” → blocca
    this.vista = vista;
    this.lastVistaOnline = vista;
  }

  setOrdina(tipo: string): void {
    this.ordinamento = tipo;
    this.applicaOrdinamento();
  }

  private applicaOrdinamento(): void {
    switch (this.ordinamento) {
      case 'alfabetico':
        this.film.sort((a, b) => a.titolo.localeCompare(b.titolo));
        break;
      case 'anno-crescente':
        this.film.sort((a, b) => a.anno - b.anno);
        break;
      case 'anno-decrescente':
        this.film.sort((a, b) => b.anno - a.anno);
        break;
    }
  }

  // ---------- Modifica ----------
  onClickModifica(film: Film): void {
    if (!this.onlineEffettivo) {
      this.openOfflineModal();
      return;
    }
    this.customMovieModal.open(film);
  }

  onFilmSaved(): void {
    this.messaggio = 'Film salvato con successo.';
    this.caricaDaBackend();
    setTimeout(() => this.messaggio = '', 3000);
  }

  // ---------- Rimozione ----------
  onClickRimuovi(f: Film): void {
    this.noPermessiMsg = '';

    // ❌ Offline effettivo: blocca e mostra modale informativo
    if (!this.onlineEffettivo) {
      this.openOfflineModal();
      return;
    }

    this.selectedForDelete = f;

    if (!this.loggedIn) {
      // memorizza intento e mostra gate
      this.pendingAfterLogin = { action: 'delete', film: f };
      this.openLoginRequired();
      return;
    }
    this.apriConfermaDelete();
  }

  private openOfflineModal(): void {
    const el = document.getElementById('offlineActionModal');
    if (el) new Modal(el).show();
  }

  private apriConfermaDelete(): void {
    const el = document.getElementById('confirmDeleteModal');
    if (el) new Modal(el).show();
  }

  annullaDelete(): void {
    const el = document.getElementById('confirmDeleteModal');
    if (!el) return;
    (Modal.getInstance(el) || new Modal(el)).hide();
  }

  confermaDelete(): void {
    if (!this.selectedForDelete || this.isDeleting) return;
    this.isDeleting = true;

    const el = document.getElementById('confirmDeleteModal');
    const modalInst = el ? (Modal.getInstance(el) || new Modal(el)) : null;

    this.collezioneService.rimuoviFilm(this.selectedForDelete.id)
      .then(() => {
        modalInst?.hide();
        this.caricaDaBackend();
        this.messaggio = 'Film rimosso dalla collezione.';
        setTimeout(() => this.messaggio = '', 3000);
      })
      .catch((e: HttpErrorResponse) => {
        if (e?.status === 401 || e?.status === 403) {
          this.pendingAfterLogin = { action: 'delete', film: this.selectedForDelete! };
          modalInst?.hide();
          this.openLoginRequired();
          return;
        }
        console.error('Errore durante la rimozione:', e);
        this.loadErrorMsg = 'Errore durante la rimozione. Lista non aggiornata.';
      })
      .finally(() => {
        this.isDeleting = false;
      });
  }

  // Stato bottone "torna su"
  @HostListener('window:scroll', [])
  onWindowScroll() {
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    this.isScrollButtonVisible = scrollY > 300; // Mostra dopo 300px di scroll
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  public getPosterUrl(film: Film): string | null {
    if (film.posterUrl) {
      return film.posterUrl;
    }
    if (film.posterPath) {
      return 'https://image.tmdb.org/t/p/w300' + film.posterPath;
    }
    return null;
  }

}
