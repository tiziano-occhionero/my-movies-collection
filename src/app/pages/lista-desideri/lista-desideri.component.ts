import { Component, OnInit, ViewChild, HostListener, AfterViewInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { RicercaService } from '../../services/ricerca.service';
import { CollezioneService } from '../../services/collezione.service';
import { ListaDesideriService } from '../../services/lista-desideri.service';
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
  selector: 'app-lista-desideri',
  templateUrl: './lista-desideri.component.html',
  styleUrls: ['./lista-desideri.component.scss'],
  standalone: true,
  imports: [CommonModule, LoginModalComponent, LogoutModalComponent, CustomMovieModalComponent]
})
export class ListaDesideriComponent implements OnInit, AfterViewInit {
  @ViewChild('loginRef') loginModal!: LoginModalComponent;
  @ViewChild('logoutRef') logoutModal!: LogoutModalComponent;
  @ViewChild('customMovieRef') customMovieModal!: CustomMovieModalComponent;

  // Dati
  listaDesideri: Film[] = [];
  listaDesideriFiltrata: Film[] = [];

  // Vista & ordinamento (come Collezione)
  vista: 'galleria' | 'elenco' = 'galleria';
  lastVistaOnline: 'galleria' | 'elenco' = 'galleria';
  ordinamento: 'alfabetico' | 'anno-crescente' | 'anno-decrescente' = 'alfabetico';

  // Stato rete / auth
  isOnline: boolean = true;
  messaggio: string = '';
  get loggedIn(): boolean { return this.auth.isLoggedIn(); }
  get username(): string | null { return this.auth.getLoggedUsername(); }

  // Avvisi
  noPermessiMsg: string = '';
  azioneMsg: string = '';

  // Stato rimozione
  selectedForDelete: Film | null = null;
  isDeleting = false;

  // Stato bottone "torna su"
  isScrollButtonVisible = false;

  // Azione pendente post-login
  private pendingAfterLogin: { action: 'delete' | 'move'; film: Film } | null = null;

  // Query corrente (solo display/filtri)
  private wishlistQueryView: string = '';

  // Backend awake
  isBackendAwake = false;
  get onlineEffettivo(): boolean { return this.isOnline && this.isBackendAwake; }

  constructor(
    private collezioneService: CollezioneService,
    private listaDesideriService: ListaDesideriService,
    private networkService: NetworkService,
    private http: HttpClient,
    private ricercaService: RicercaService,
    public auth: AuthService,
    private health: HealthService,
    private elementRef: ElementRef
  ) { }

  ngOnInit(): void {
    // Sveglia Render e osserva lo stato backend
    this.health.start();
    this.health.isAwake$().subscribe((ok: boolean) => this.isBackendAwake = ok);

    // Stato rete + primi dati
    this.networkService.isOnline().subscribe(isOnline => {
      this.isOnline = isOnline;
      this.loadListaDesideri();
    });

    // 🔎 query da navbar
    this.ricercaService.wishlistQuery$.subscribe(q => {
      this.wishlistQueryView = q;
      this.applicaFiltro();
    });
  }

  private loadListaDesideri(): void {
    if (!this.onlineEffettivo) {
      this.vista = 'elenco';
      this.caricaDaLocale();
      return;
    }

    this.vista = this.lastVistaOnline;
    this.listaDesideriService.getTuttiIFilm().subscribe({
      next: (dati) => {
        this.listaDesideri = dati ?? [];
        this.applicaFiltro();
      },
      error: (err) => {
        console.error('Errore nel caricamento da backend:', err);
        this.caricaDaLocale();
      }
    });
  }

  ngAfterViewInit(): void {
    // Inizializza i dropdown di Bootstrap
    const dropdownElementList = [].slice.call(this.elementRef.nativeElement.querySelectorAll('[data-bs-toggle="dropdown"]'));
    dropdownElementList.map((dropdownToggleEl: any) => {
      return new Dropdown(dropdownToggleEl);
    });
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
    this.azioneMsg = 'Film salvato con successo.';
    this.loadListaDesideri();
    setTimeout(() => this.azioneMsg = '', 3000);
  }

  // ---------- Helpers filtro + ordinamento ----------
  private applicaFiltro(): void {
    const q = (this.wishlistQueryView || '').trim().toLowerCase();
    if (!q) {
      this.listaDesideriFiltrata = [...this.listaDesideri];
    } else {
      this.listaDesideriFiltrata = this.listaDesideri.filter(f =>
        (f.titolo || '').toLowerCase().includes(q)
      );
    }
    this.applicaOrdinamento();
  }

  private applicaOrdinamento(): void {
    switch (this.ordinamento) {
      case 'alfabetico':
        this.listaDesideriFiltrata.sort((a, b) => (a.titolo || '').localeCompare(b.titolo || ''));
        break;
      case 'anno-crescente':
        this.listaDesideriFiltrata.sort((a, b) => (a.anno || 0) - (b.anno || 0));
        break;
      case 'anno-decrescente':
        this.listaDesideriFiltrata.sort((a, b) => (b.anno || 0) - (a.anno || 0));
        break;
    }
  }

  setVista(v: 'galleria' | 'elenco'): void {
    if (!this.onlineEffettivo) return; // blocca se backend non pronto
    this.vista = v;
    if (this.isOnline) this.lastVistaOnline = v;
  }

  setOrdina(tipo: 'alfabetico' | 'anno-crescente' | 'anno-decrescente'): void {
    this.ordinamento = tipo;
    this.applicaOrdinamento();
  }

  private caricaDaLocale(): void {
    const data = this.listaDesideriService.getLocal?.()
      ?? localStorage.getItem('listaDesideri');
    this.listaDesideri = Array.isArray(data) ? data : (data ? JSON.parse(data) : []);
    this.applicaFiltro();
  }

  // ---------- Modali login/gate ----------
  private openLoginModalSafely(): void {
    const open = document.querySelector('.modal.show') as HTMLElement | null;
    if (open) (Modal.getInstance(open) || new Modal(open)).hide();
    setTimeout(() => this.loginModal?.open(), 200);
  }
  private openLoginRequired(): void {
    const el = document.getElementById('loginRequiredModal');
    if (el) new Modal(el).show();
  }
  private closeLoginRequired(): void {
    const el = document.getElementById('loginRequiredModal');
    if (!el) return;
    (Modal.getInstance(el) || new Modal(el)).hide();
  }
  procediAlLogin(): void {
    this.closeLoginRequired();
    this.openLoginModalSafely();
  }
  apriLogin(): void {
    const open = document.querySelector('.modal.show') as HTMLElement | null;
    if (open) (Modal.getInstance(open) || new Modal(open)).hide();
    setTimeout(() => this.loginModal?.open(), 250);
  }

  onLoggedIn(e: { username: string; password: string }) {
    this.auth.login(e.username, e.password);
    this.loginModal?.close?.();
    this.noPermessiMsg = '';

    if (this.pendingAfterLogin) {
      const { action, film } = this.pendingAfterLogin;
      this.pendingAfterLogin = null;

      if (action === 'delete') {
        this.selectedForDelete = film;
        this.apriConfermaDelete();
      } else if (action === 'move') {
        this.performMoveToCollection(film);
      }
    }
  }

  confermaLogout(): void {
    this.auth.logout?.();
    this.messaggio = 'Hai effettuato il logout.';
    setTimeout(() => this.messaggio = '', 3000);
  }

  // ---------- Click handlers ----------
  onClickElimina(film: Film): void {
    this.noPermessiMsg = '';
    if (!this.onlineEffettivo) {
      this.openOfflineModal();
      return;
    }
    if (!this.loggedIn) {
      this.pendingAfterLogin = { action: 'delete', film };
      this.openLoginRequired();
      return;
    }
    this.selectedForDelete = film;
    this.apriConfermaDelete();
  }

  onClickAggiungiAllaCollezione(film: Film): void {
    this.noPermessiMsg = '';
    if (!this.onlineEffettivo) {
      this.openOfflineModal();
      return;
    }
    if (!this.loggedIn) {
      this.pendingAfterLogin = { action: 'move', film };
      this.openLoginRequired();
      return;
    }
    this.performMoveToCollection(film);
  }

  // ---------- Modale conferma delete ----------
  private apriConfermaDelete(): void {
    const el = document.getElementById('confirmDeleteModal');
    if (el) new Modal(el).show();
  }
  annullaDelete(): void {
    const el = document.getElementById('confirmDeleteModal');
    if (!el) return;
    (Modal.getInstance(el) || new Modal(el)).hide();
    this.selectedForDelete = null;
  }

  confermaDelete(): void {
    if (!this.selectedForDelete || this.isDeleting) return;
    this.isDeleting = true;

    const el = document.getElementById('confirmDeleteModal');
    const inst = el ? (Modal.getInstance(el) || new Modal(el)) : null;

    const id = this.selectedForDelete.id;
    this.listaDesideriService.rimuoviFilm(id)
      .then(() => {
        inst?.hide();
        this.listaDesideri = this.listaDesideri.filter(f => f.id !== id);
        this.listaDesideriService.setLocal?.(this.listaDesideri);
        this.applicaFiltro();
        this.azioneMsg = 'Film rimosso dalla wishlist.';
        setTimeout(() => this.azioneMsg = '', 3000);
      })
      .catch((e: any) => {
        const err = e as HttpErrorResponse;
        if (err?.status === 401 || err?.status === 403) {
          this.pendingAfterLogin = { action: 'delete', film: this.selectedForDelete! };
          inst?.hide();
          this.openLoginRequired();
          return;
        }
        console.error('Errore rimozione wishlist:', err);
        this.azioneMsg = 'Errore durante la rimozione. Lista non aggiornata.';
        setTimeout(() => this.azioneMsg = '', 3500);
      })
      .finally(() => {
        this.isDeleting = false;
        this.selectedForDelete = null;
      });
  }

  // ---------- Sposta in collezione ----------
  private performMoveToCollection(film: Film): void {
    this.listaDesideriService.rimuoviFilm(film.id).then(() => {
      const filmConvertito: Film = { ...film, provenienza: 'collezione' as 'collezione' };
      this.collezioneService.aggiungiFilm(filmConvertito).subscribe({
        next: () => {
          this.listaDesideri = this.listaDesideri.filter(f => f.id !== film.id);
          this.listaDesideriService.setLocal?.(this.listaDesideri);
          this.applicaFiltro();
          this.azioneMsg = 'Spostato in collezione.';
          setTimeout(() => this.azioneMsg = '', 3000);
        },
        error: (err: HttpErrorResponse) => {
          if (err.status === 401 || err.status === 403) {
            this.pendingAfterLogin = { action: 'move', film };
            this.openLoginRequired();
            return;
          }
          console.error('Errore durante il salvataggio in collezione:', err);
          this.azioneMsg = 'Errore durante lo spostamento. Lista non aggiornata.';
          setTimeout(() => this.azioneMsg = '', 3500);
        }
      });
    }).catch((e: any) => {
      const err = e as HttpErrorResponse;
      if (err.status === 401 || err.status === 403) {
        this.pendingAfterLogin = { action: 'move', film };
        this.openLoginRequired();
        return;
      }
      console.error('Errore nella rimozione preliminare dalla wishlist:', err);
      this.azioneMsg = 'Errore di rimozione dalla wishlist.';
      setTimeout(() => this.azioneMsg = '', 3500);
    });
  }

  private openOfflineModal(): void {
    const modalEl = document.getElementById('offlineOperationModal');
    if (modalEl) Modal.getOrCreateInstance(modalEl).show();
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

}
