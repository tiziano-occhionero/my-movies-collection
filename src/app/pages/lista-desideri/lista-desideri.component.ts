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

@Component({
  selector: 'app-lista-desideri',
  templateUrl: './lista-desideri.component.html',
  styleUrls: ['./lista-desideri.component.scss'],
  standalone: true,
  imports: [CommonModule, LoginModalComponent]
})
export class ListaDesideriComponent implements OnInit {
  @ViewChild('loginRef') loginModal!: LoginModalComponent;

  listaDesideri: Film[] = [];
  isOnline: boolean = true;

  // avvisi
  noPermessiMsg: string = '';
  azioneMsg: string = '';

  // stato rimozione
  selectedForDelete: Film | null = null;
  isDeleting = false;

  // azione pendente post-login
  private pendingAfterLogin: { action: 'delete' | 'move'; film: Film } | null = null;

  constructor(
    private collezioneService: CollezioneService,
    private listaDesideriService: ListaDesideriService,
    private networkService: NetworkService,
    private http: HttpClient,
    private ricercaService: RicercaService,
    public auth: AuthService
  ) { }

  ngOnInit(): void {
    this.networkService.isOnline().subscribe(isOnline => {
      this.isOnline = isOnline;

      if (isOnline) {
        this.listaDesideriService.getTuttiIFilm().subscribe({
          next: (dati) => this.listaDesideri = dati,
          error: (err) => {
            console.error('Errore nel caricamento da backend:', err);
            this.caricaDaLocale();
          }
        });
      } else {
        this.caricaDaLocale();
      }
    });
  }

  get loggedIn(): boolean { return this.auth.isLoggedIn(); }
  get username(): string | null { return this.auth.getLoggedUsername(); }

  // ---------- Helpers modali (come in Inserimento/Collezione) ----------
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
    // chiudi login modal se disponibile
    this.loginModal?.close?.();
    this.noPermessiMsg = '';

    // riprendi eventuale azione
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

  onLogoutClick(): void {
    this.auth.logout();
    alert('Hai effettuato il logout.');
  }

  private caricaDaLocale(): void {
    const data = localStorage.getItem('listaDesideri');
    this.listaDesideri = data ? JSON.parse(data) : [];
  }

  // ---------- Click handlers pubblici ----------
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
  }

  confermaDelete(): void {
    if (!this.selectedForDelete || this.isDeleting) return;
    this.isDeleting = true;

    const el = document.getElementById('confirmDeleteModal');
    const inst = el ? (Modal.getInstance(el) || new Modal(el)) : null;

    this.listaDesideriService.rimuoviFilm(this.selectedForDelete.id)
      .then(() => {
        inst?.hide();
        // aggiorna UI locale
        this.listaDesideri = this.listaDesideri.filter(f => f.id !== this.selectedForDelete!.id);
        localStorage.setItem('listaDesideri', JSON.stringify(this.listaDesideri));
        this.azioneMsg = 'Film rimosso dalla wishlist.';
        setTimeout(() => this.azioneMsg = '', 3000);
      })
      .catch((e: any) => {
        const err = e as HttpErrorResponse;
        if (err?.status === 401 || err?.status === 403) {
          // sessione assente/scaduta → chiedi login e riprendi dopo
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
      });
  }

  // ---------- Sposta in collezione ----------
  private performMoveToCollection(film: Film): void {
    // 1) rimuovi dalla wishlist
    this.listaDesideriService.rimuoviFilm(film.id).then(() => {
      // 2) aggiungi in collezione (cambiando provenienza)
      const filmConvertito: Film = { ...film, provenienza: 'collezione' as 'collezione' };

      this.collezioneService.aggiungiFilm(filmConvertito).subscribe({
        next: () => {
          // aggiorna UI locale
          this.listaDesideri = this.listaDesideri.filter(f => f.id !== film.id);
          localStorage.setItem('listaDesideri', JSON.stringify(this.listaDesideri));
          this.azioneMsg = 'Spostato in collezione.';
          setTimeout(() => this.azioneMsg = '', 3000);
        },
        error: (err: HttpErrorResponse) => {
          if (err.status === 401 || err.status === 403) {
            // chiedi login e riprendi l’azione dopo
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
