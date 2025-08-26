import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { RicercaService } from '../../services/ricerca.service';
import { CollezioneService } from '../../services/collezione.service';
import { NetworkService } from '../../services/network.service';
import { AuthService } from '../../services/auth.service';

import { Film } from '../../models/film.model';
import { LoginModalComponent } from '../../components/login-modal/login-modal.component';

@Component({
  selector: 'app-collezione',
  templateUrl: './collezione.component.html',
  styleUrls: ['./collezione.component.scss'],
  standalone: true,
  imports: [CommonModule, LoginModalComponent]
})
export class CollezioneComponent implements OnInit {
  @ViewChild('loginRef') loginModal!: LoginModalComponent;

  tuttiIFilm: Film[] = [];
  film: Film[] = [];
  vista: 'galleria' | 'elenco' = 'galleria';
  query: string = '';
  ordinamento: string = 'alfabetico';
  messaggio: string = '';
  isOnline: boolean = true;
  queryCorrente: string = '';

  // avvisi
  noPermessiMsg: string = '';
  loadErrorMsg: string = '';

  constructor(
    private collezioneService: CollezioneService,
    private ricercaService: RicercaService,
    private networkService: NetworkService,
    public auth: AuthService
  ) { }

  ngOnInit(): void {
    this.networkService.isOnline().subscribe(isOnline => {
      this.isOnline = isOnline;
      if (isOnline) {
        this.caricaDaBackend();
      } else {
        this.caricaDaLocale();
      }
    });

    this.ricercaService.query$.subscribe((query: string) => {
      this.queryCorrente = query;
      this.query = (query || '').toLowerCase();
      this.applicaRicerca();
    });
  }

  get loggedIn(): boolean { return this.auth.isLoggedIn(); }
  get username(): string | null { return this.auth.getLoggedUsername(); }

  apriLogin(): void {
    this.loginModal?.open();
  }

  onLoggedIn(e: { username: string; password: string }) {
    this.auth.login(e.username, e.password);
    this.noPermessiMsg = '';
    if (this.isOnline) this.caricaDaBackend();
  }

  onLogoutClick(): void {
    this.auth.logout();
    alert('Hai effettuato il logout.');
  }

  private caricaDaBackend(): void {
    const snapshot = [...this.tuttiIFilm];
    this.loadErrorMsg = '';
    this.noPermessiMsg = '';

    this.collezioneService.getTuttiIFilm().subscribe({
      next: (dati) => {
        this.tuttiIFilm = dati ?? [];
        this.film = [...this.tuttiIFilm];
        this.applicaRicerca();
      },
      error: (err: HttpErrorResponse) => {
        console.error('GET collezione fallito:', err);
        // NON svuotare: ripristina la lista precedente e mostra l’alert
        this.tuttiIFilm = snapshot;
        this.film = [...this.tuttiIFilm];
        this.applicaRicerca();
        this.loadErrorMsg = `Impossibile aggiornare dalla rete (status ${err.status || 'n/d'}). Mostro i dati già caricati.`;
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
      (f.titolo || '').toLowerCase().includes(this.query)
    );
    this.applicaOrdinamento();
  }

  setVista(vista: 'galleria' | 'elenco'): void {
    this.vista = vista;
  }

  setOrdina(tipo: string): void {
    this.ordinamento = tipo;
    this.applicaOrdinamento();
  }

  async rimuoviDaCollezione(f: Film): Promise<void> {
    const conferma = confirm(`Rimuovere "${f.titolo}" dalla collezione?`);
    if (!conferma) return;

    // reset messaggi
    this.messaggio = '';
    this.noPermessiMsg = '';
    this.loadErrorMsg = '';

    // OFFLINE: aggiorna solo localStorage
    if (!this.isOnline) {
      const key = 'collezioneFilm';
      const corrente: Film[] = this.collezioneService.getCollezione();
      const aggiornata = (corrente || []).filter(x => x.id !== f.id);
      localStorage.setItem(key, JSON.stringify(aggiornata));

      // aggiorna UI
      this.tuttiIFilm = aggiornata;
      this.applicaRicerca();
      this.messaggio = 'Film rimosso dalla collezione.';
      setTimeout(() => (this.messaggio = ''), 3000);
      return;
    }

    // ONLINE: rimozione ottimistica
    const snapshot = [...this.tuttiIFilm];
    // 1) togli subito dalla UI
    this.tuttiIFilm = this.tuttiIFilm.filter(x => x.id !== f.id);
    this.applicaRicerca();

    try {
      console.log('[COLLEZIONE] DELETE id =', f.id);
      await this.collezioneService.rimuoviFilm(f.id);

      // 2) tenta un refresh dal backend (se fallisce, lasciamo la lista com'è)
      this.collezioneService.getTuttiIFilm().subscribe({
        next: (dati) => {
          this.tuttiIFilm = dati ?? [];
          this.applicaRicerca();
          this.messaggio = 'Film rimosso dalla collezione.';
          setTimeout(() => (this.messaggio = ''), 3000);
        },
        error: (err: HttpErrorResponse) => {
          console.error('[COLLEZIONE] refresh post-DELETE fallito:', err);
          this.loadErrorMsg = 'Rimozione fatta, ma non sono riuscito ad aggiornare la lista dal server.';
          // manteniamo la lista già aggiornata (no rollback)
        }
      });
    } catch (e: any) {
      const err = e as HttpErrorResponse;
      // rollback UI SOLO se errore “serio”
      this.tuttiIFilm = snapshot;
      this.applicaRicerca();

      if (err?.status === 401 || err?.status === 403) {
        this.noPermessiMsg = 'Operazione riservata. Effettua il login per continuare.';
        return;
      }
      console.error('[COLLEZIONE] DELETE errore:', err);
      this.loadErrorMsg = 'Errore durante la rimozione. Lista non aggiornata.';
    }
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
}
