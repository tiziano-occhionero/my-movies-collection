import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RicercaService } from '../../services/ricerca.service';
import { CollezioneService } from '../../services/collezione.service';
import { ListaDesideriService } from '../../services/lista-desideri.service';
import { NetworkService } from '../../services/network.service';
import { Film } from '../../models/film.model';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-lista-desideri',
  templateUrl: './lista-desideri.component.html',
  styleUrls: ['./lista-desideri.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ListaDesideriComponent implements OnInit {
  listaDesideri: Film[] = [];
  isOnline: boolean = true;

  constructor(
    private collezioneService: CollezioneService,
    private listaDesideriService: ListaDesideriService,
    private networkService: NetworkService,
    private http: HttpClient,
    private ricercaService: RicercaService
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
      this.listaDesideri = this.listaDesideri.filter(f => f.id !== film.id);
      localStorage.setItem('listaDesideri', JSON.stringify(this.listaDesideri));
    });
  }


  aggiungiAllaCollezione(film: Film): void {
    if (!this.isOnline) {
      alert('Operazione non disponibile offline');
      return;
    }

    // Elimina prima il film dalla wishlist
    this.listaDesideriService.rimuoviFilm(film.id).then(() => {
      // Poi cambia la provenienza e invia a collezione
      const filmConvertito: Film = {
        ...film,
        provenienza: 'collezione' as 'collezione'
      };

      this.collezioneService.aggiungiFilm(filmConvertito).subscribe({
        next: () => {
          this.listaDesideri = this.listaDesideri.filter(f => f.id !== film.id);
        },
        error: (err) => {
          console.error('Errore durante il salvataggio in collezione:', err);
        }
      });
    });
  }
}
