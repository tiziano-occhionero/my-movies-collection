import { Component, ViewChild, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Modal from 'bootstrap/js/dist/modal';

import { LoginModalComponent } from '../../components/login-modal/login-modal.component';
import { RicercaService } from '../../services/ricerca.service';
import { CollezioneService } from '../../services/collezione.service';
import { TmdbService } from '../../services/tmdb.service';
import { ListaDesideriService } from '../../services/lista-desideri.service';
import { AuthService } from '../../services/auth.service';

import { Film } from '../../models/film.model';
import { LogoutModalComponent } from '../../components/logout-modal/logout-modal.component';
import { NetworkService } from '../../services/network.service';

@Component({
  selector: 'app-inserimento',
  standalone: true,
  imports: [CommonModule, FormsModule, LoginModalComponent, LogoutModalComponent],
  templateUrl: './inserimento.component.html',
  styleUrls: ['./inserimento.component.scss']
})
export class InserimentoComponent implements OnInit {
  @ViewChild('loginRef') loginModal!: LoginModalComponent;
  @ViewChild('logoutRef') logoutModal!: LogoutModalComponent;

  film: any[] = [];
  ricercaEffettuata = false;
  filmSelezionato: any = null;
  formatoSelezionato: Film['formato'] | '' = '';
  custodiaSelezionata: Film['custodia'] | '' = '';
  filmGiaPresente = false;
  confermaSuccesso = false;
  messaggio: string = '';
  isOnline: boolean = true;

  // stato salvataggio
  isSaving = false;

  // azione da riprendere dopo login (se l’utente era sloggato)
  private pendingAfterLogin: { action: 'openAdd'; film: any } | null = null;

  // (legacy) avviso dentro modale: non più usato per l’apertura
  noPermessi = false;

  constructor(
    private ricercaService: RicercaService,
    private collezioneService: CollezioneService,
    private tmdbService: TmdbService,
    private listaDesideriService: ListaDesideriService,
    public auth: AuthService,
    private networkService: NetworkService,
  ) { }

  ngOnInit(): void {
    // Stato rete
    this.networkService.isOnline().subscribe((isOnline: boolean) => {
      this.isOnline = isOnline;
    });

    // Risultati ricerca film
    this.ricercaService.risultatiApi$.subscribe((risultati) => {
      // Mostra solo film con poster_path presente
      this.film = risultati.filter(f => f.poster_path);
    });
    /*
    this.ricercaService.risultatiApi$.subscribe((risultati) => {
      this.film = risultati;
    });*/

    // Stato ricerca effettuata
    this.ricercaService.ricercaApiEffettuata$.subscribe((val) => {
      this.ricercaEffettuata = val;
    });
  }

  get username(): string | null { return this.auth.getLoggedUsername(); }
  get loggedIn(): boolean { return this.auth.isLoggedIn(); }

  /** Login modal "sicura": chiude eventuali modali bootstrap prima di aprire la login */
  private openLoginModalSafely(): void {
    const openModalEl = document.querySelector('.modal.show') as HTMLElement | null;
    if (openModalEl) {
      const inst = Modal.getInstance(openModalEl) || new Modal(openModalEl);
      inst.hide();
    }
    setTimeout(() => this.loginModal?.open(), 200);
  }

  /** Modale "Accesso richiesto" (gate prima del form di login) */
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

  /** chiamata dal bottone "Accedi" nel gate, o dal pulsante Login in testata */
  procediAlLogin(): void {
    this.closeLoginRequired();
    this.openLoginModalSafely();
  }

  /**
   * Apre la login modal in modo sicuro (fallback se usata altrove)
   */
  apriLogin(): void {
    const openModalEl = document.querySelector('.modal.show') as HTMLElement | null;
    if (openModalEl) {
      const instance = Modal.getInstance(openModalEl) || new Modal(openModalEl);
      instance.hide();
    }
    setTimeout(() => {
      this.loginModal?.open();
    }, 250);
  }

  onLoggedIn(e: { username: string; password: string }) {
    this.auth.login(e.username, e.password);

    // chiudi subito il login modal (se il componente espone close(); uso ?.)
    this.loginModal?.close?.();

    // se avevamo un'azione pendente (apertura del modale di conferma per un film), riprendila
    if (this.pendingAfterLogin?.action === 'openAdd' && this.pendingAfterLogin.film) {
      this.filmSelezionato = this.pendingAfterLogin.film;
      this.pendingAfterLogin = null;

      const m = document.getElementById('confermaAggiuntaModal');
      if (m) new Modal(m).show();
    }
  }

  /*
  onLogoutClick(): void {
    this.logoutModal.open();
  }*/

  confermaLogout(): void {
    this.auth.logout?.();
    this.messaggio = 'Hai effettuato il logout.';
    setTimeout(() => this.messaggio = '', 3000);
  }

  caricaDettagliFilm(film: any): void {
    if (film.dettagliCaricati) return;

    this.tmdbService.getDettagliFilm(film.id).subscribe(dettagli => {
      film.genre_names = dettagli?.genres?.map((g: any) => g.name) ?? [];
    });

    this.tmdbService.getCreditiFilm(film.id).subscribe(crediti => {
      const crew = crediti?.crew ?? [];
      const cast = crediti?.cast ?? [];
      const regista = crew.find((m: any) => m?.job === 'Director');
      const attoriPrincipali = cast.slice(0, 3);

      film.regista = regista ? regista.name : 'N/A';
      film.attori = attoriPrincipali.map((a: any) => a?.name).filter(Boolean);
      film.dettagliCaricati = true;
    });
  }

  /** Click su "Aggiungi alla collezione" */
  apriModale(film: any): void {
    this.filmSelezionato = film;
    this.formatoSelezionato = '';
    this.custodiaSelezionata = '';
    this.confermaSuccesso = false;
    this.filmGiaPresente = false;

    if (!this.loggedIn) {
      // memorizza l’intento e mostra il gate “Accesso richiesto”
      this.pendingAfterLogin = { action: 'openAdd', film };
      this.openLoginRequired();
      return;
    }

    const modalElement = document.getElementById('confermaAggiuntaModal');
    if (modalElement) new Modal(modalElement).show();
  }

  private resetForm(): void {
    setTimeout(() => {
      this.confermaSuccesso = false;
      this.formatoSelezionato = '';
      this.custodiaSelezionata = '';
      this.filmSelezionato = null;

      const modalElement = document.getElementById('confermaAggiuntaModal');
      if (modalElement) {
        const modal = Modal.getInstance(modalElement);
        modal?.hide();
      }
    }, 2000);
  }

  mostraMessaggioGiaPresente(): void {
    this.filmGiaPresente = true;
    const modalElement = document.getElementById('confermaAggiuntaModal');
    if (modalElement) {
      const modal = Modal.getInstance(modalElement);
      setTimeout(() => modal?.hide(), 2000);
    }
    setTimeout(() => (this.filmGiaPresente = false), 2000);
  }

  private buildFilmCollezione(): Film {
    return {
      id: `${this.filmSelezionato.id}_${this.formatoSelezionato}_${this.custodiaSelezionata}`,
      tmdbId: this.filmSelezionato.id,
      titolo: this.filmSelezionato.title,
      anno: this.filmSelezionato.release_date
        ? new Date(this.filmSelezionato.release_date).getFullYear()
        : 0,
      posterPath: this.filmSelezionato.poster_path,
      formato: this.formatoSelezionato as Film['formato'],
      custodia: this.custodiaSelezionata as Film['custodia'],
      provenienza: 'collezione'
    };
  }

  private buildFilmWishlist(): Film {
    return {
      id: `${this.filmSelezionato.id}_${this.formatoSelezionato}_${this.custodiaSelezionata}`,
      tmdbId: this.filmSelezionato.id,
      titolo: this.filmSelezionato.title,
      anno: this.filmSelezionato.release_date
        ? new Date(this.filmSelezionato.release_date).getFullYear()
        : 0,
      posterPath: this.filmSelezionato.poster_path,
      formato: this.formatoSelezionato as Film['formato'],
      custodia: this.custodiaSelezionata as Film['custodia'],
      provenienza: 'wishlist'
    };
  }

  confermaAggiunta(): void {
    if (!this.filmSelezionato || !this.formatoSelezionato || !this.custodiaSelezionata || this.isSaving) return;
    this.isSaving = true;

    const id = `${this.filmSelezionato.id}_${this.formatoSelezionato}_${this.custodiaSelezionata}`;

    this.collezioneService.getTuttiIFilm().subscribe(collezione => {
      this.listaDesideriService.getTuttiIFilm().subscribe(wishlist => {
        const filmGiaInCollezione = collezione.some(f => f.id === id);
        const filmGiaInWishlist = wishlist.some(f => f.id === id);

        if (filmGiaInCollezione || filmGiaInWishlist) {
          this.isSaving = false;
          this.mostraMessaggioGiaPresente();
          return;
        }

        const filmSalvato = this.buildFilmCollezione();

        this.collezioneService.aggiungiFilm(filmSalvato).subscribe({
          next: () => {
            this.isSaving = false;
            this.noPermessi = false;
            this.confermaSuccesso = true;
            this.resetForm();
          },
          error: (err) => {
            this.isSaving = false;
            if (err?.status === 401 || err?.status === 403) {
              // sessione scaduta: riproponi il gate
              this.pendingAfterLogin = { action: 'openAdd', film: this.filmSelezionato };
              this.openLoginRequired();
              return;
            }
            console.error('Errore durante l\'aggiunta alla collezione:', err);
          }
        });
      });
    });
  }

  aggiungiAllaListaDesideri(): void {
    if (!this.filmSelezionato || !this.formatoSelezionato || !this.custodiaSelezionata) return;

    const id = `${this.filmSelezionato.id}_${this.formatoSelezionato}_${this.custodiaSelezionata}`;

    this.collezioneService.getTuttiIFilm().subscribe(collezione => {
      this.listaDesideriService.getTuttiIFilm().subscribe(wishlist => {
        const filmGiaInCollezione = collezione.some(f => f.id === id);
        const filmGiaInWishlist = wishlist.some(f => f.id === id);

        if (filmGiaInWishlist || filmGiaInCollezione) {
          this.mostraMessaggioGiaPresente();
          return;
        }

        const filmDaSalvare = this.buildFilmWishlist();

        this.listaDesideriService.aggiungiFilm(filmDaSalvare).subscribe({
          next: () => {
            this.noPermessi = false;
            this.confermaSuccesso = true;
            this.resetForm();
          },
          error: (err: HttpErrorResponse) => {
            if (err.status === 401 || err.status === 403) {
              this.pendingAfterLogin = { action: 'openAdd', film: this.filmSelezionato };
              this.openLoginRequired();
              return;
            }
            console.error('Errore durante il salvataggio nella lista desideri:', err);
          }
        });
      });
    });
  }
}
