import { Component, OnInit, ViewChild } from '@angular/core';
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
import { LogoutModalComponent } from '../../components/logout-modal/logout-modal.component';

@Component({
  selector: 'app-lista-desideri',
  templateUrl: './lista-desideri.component.html',
  styleUrls: ['./lista-desideri.component.scss'],
  standalone: true,
  imports: [CommonModule, LoginModalComponent, LogoutModalComponent]
})
export class ListaDesideriComponent implements OnInit {
  @ViewChild('loginRef') loginModal!: LoginModalComponent;
  @ViewChild('logoutRef') logoutModal!: LogoutModalComponent;

  // Dati
  listaDesideri: Film[] = [];
  listaDesideriFiltrata: Film[] = [];

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

  // Azione pendente post-login
  private pendingAfterLogin: { action: 'delete' | 'move'; film: Film } | null = null;

  // Query corrente (solo display/filtri)
  private wishlistQueryView: string = '';

  constructor(
    private collezioneService: CollezioneService,
    private listaDesideriService: ListaDesideriService,
    private networkService: NetworkService,
    private http: HttpClient,
    private ricercaService: RicercaService,
    public auth: AuthService
  ) { }

  ngOnInit(): void {
    // Stato rete + primi dati
    this.networkService.isOnline().subscribe(isOnline => {
      this.isOnline = isOnline;

      if (isOnline) {
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
      } else {
        this.caricaDaLocale();
      }
    });

    // 🔎 ascolta la query da navbar (wishlist)
    this.ricercaService.wishlistQuery$.subscribe(q => {
      this.wishlistQueryView = q;
      this.applicaFiltro();
    });
  }

  // ---------- Helpers filtro ----------
  private applicaFiltro(): void {
    const q = (this.wishlistQueryView || '').trim().toLowerCase();
    if (!q) {
      this.listaDesideriFiltrata = [...this.listaDesideri];
      return;
    }
    this.listaDesideriFiltrata = this.listaDesideri.filter(f =>
      (f.titolo || '').toLowerCase().includes(q)
    );
  }

  private caricaDaLocale(): void {
    this.listaDesideri = this.listaDesideriService.getLocal();
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

    // Riprendi eventuale azione
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

  /*
  onLogoutClick(): void {
    this.logoutModal.open();
  }*/

  confermaLogout(): void {
    this.auth.logout?.();
    this.messaggio = 'Hai effettuato il logout.';
    setTimeout(() => this.messaggio = '', 3000);
  }

  // ---------- Click handlers ----------
  onClickElimina(film: Film): void {
    this.noPermessiMsg = '';
    if (!this.isOnline) {
      alert('Operazione non disponibile offline');
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
    if (!this.isOnline) {
      alert('Operazione non disponibile offline');
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
        // Aggiorna dati e UI
        this.listaDesideri = this.listaDesideri.filter(f => f.id !== id);
        localStorage.setItem('listaDesideri', JSON.stringify(this.listaDesideri));
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
    // 1) rimuovi dalla wishlist
    this.listaDesideriService.rimuoviFilm(film.id).then(() => {
      // 2) aggiungi in collezione
      const filmConvertito: Film = { ...film, provenienza: 'collezione' as 'collezione' };
      this.collezioneService.aggiungiFilm(filmConvertito).subscribe({
        next: () => {
          // aggiorna dati e UI
          this.listaDesideri = this.listaDesideri.filter(f => f.id !== film.id);
          localStorage.setItem('listaDesideri', JSON.stringify(this.listaDesideri));
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
}
