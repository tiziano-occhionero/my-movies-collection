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

  // messaggi permessi
  noPermessiMsg: string = '';

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

  apriLogin(): void {
    this.loginModal?.open();
  }


  private caricaDaLocale(): void {
    const data = localStorage.getItem('listaDesideri');
    this.listaDesideri = data ? JSON.parse(data) : [];
  }

  elimina(film: Film): void {
    if (!this.isOnline) {
      alert('Operazione non disponibile offline');
      return;
    }

    this.listaDesideriService.rimuoviFilm(film.id).then(() => {
      // Aggiorna subito la UI
      this.listaDesideri = this.listaDesideri.filter(f => f.id !== film.id);
      localStorage.setItem('listaDesideri', JSON.stringify(this.listaDesideri));
    }).catch(err => {
      console.error('Errore rimozione wishlist:', err);
      alert('Errore durante la rimozione. Lista non aggiornata.');
    });

  }

  aggiungiAllaCollezione(film: Film): void {
    if (!this.isOnline) {
      alert('Operazione non disponibile offline');
      return;
    }

    this.listaDesideriService.rimuoviFilm(film.id).then(() => {
      const filmConvertito: Film = { ...film, provenienza: 'collezione' as 'collezione' };

      this.collezioneService.aggiungiFilm(filmConvertito).subscribe({
        next: () => {
          this.listaDesideri = this.listaDesideri.filter(f => f.id !== film.id);
        },
        error: (err: HttpErrorResponse) => {
          if (err.status === 401 || err.status === 403) {
            this.noPermessiMsg = 'Operazione riservata. Effettua il login per continuare.';
            return;
          }
          console.error('Errore durante il salvataggio in collezione:', err);
        }
      });
    }).catch((e: any) => {
      const err = e as HttpErrorResponse;
      if (err.status === 401 || err.status === 403) {
        this.noPermessiMsg = 'Operazione riservata. Effettua il login per continuare.';
        return;
      }
      console.error('Errore nella rimozione preliminare dalla wishlist:', err);
    });
  }

  onLoggedIn(e: { username: string; password: string }) {
    this.auth.login(e.username, e.password);
    this.noPermessiMsg = '';
  }

  onLogoutClick(): void {
    this.auth.logout();
    alert('Hai effettuato il logout.');
  }
}
