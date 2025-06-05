import { Component, OnInit } from '@angular/core';
import { RicercaService } from '../../services/ricerca.service';
import { CommonModule } from '@angular/common';
import { CollezioneService } from '../../services/collezione.service';
import { TmdbService } from '../../services/tmdb.service';


@Component({
  selector: 'app-inserimento',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inserimento.component.html',
  styleUrls: ['./inserimento.component.scss']
})
export class InserimentoComponent implements OnInit {
  film: any[] = [];
  ricercaEffettuata: boolean = false;

  constructor(
    private ricercaService: RicercaService,
    private collezioneService: CollezioneService,
    private tmdbService: TmdbService
  ) {}

  ngOnInit(): void {
    this.ricercaService.risultatiApi$.subscribe((risultati) => {
      this.film = risultati;
    });

    this.ricercaService.ricercaApiEffettuata$.subscribe((val) => {
      this.ricercaEffettuata = val;
    });
  }

  aggiungiAllaCollezione(film: any): void {
    this.collezioneService.aggiungiFilm(film);
    alert(`"${film.title}" aggiunto alla collezione!`);
  }

  caricaDettagliFilm(film: any): void {
    if (film.dettagliCaricati) return; // evita chiamate ripetute

    this.tmdbService.getDettagliFilm(film.id).subscribe(dettagli => {
      film.genre_names = dettagli.genres?.map((g: any) => g.name) || [];
    });

    this.tmdbService.getCreditiFilm(film.id).subscribe(crediti => {
      const regista = crediti.crew.find((m: any) => m.job === 'Director');
      const attoriPrincipali = crediti.cast.slice(0, 3); // primi 3 attori

      film.regista = regista ? regista.name : 'N/A';
      film.attori = attoriPrincipali.map((a: any) => a.name);
      film.dettagliCaricati = true;
    });
  }


}
