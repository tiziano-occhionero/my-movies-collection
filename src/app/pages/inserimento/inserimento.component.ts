import { Component, OnInit } from '@angular/core';
import { RicercaService } from '../../services/ricerca.service';
import { CommonModule } from '@angular/common';
import { CollezioneService } from '../../services/collezione.service';


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
    private collezioneService: CollezioneService
  ) {}

  ngOnInit(): void {
    this.ricercaService.risultatiApi$.subscribe((risultati) => {
      this.film = risultati;
      this.ricercaEffettuata = risultati.length > 0 || this.ricercaService.getQueryLocale().trim() !== '';
    });
  }

aggiungiAllaCollezione(film: any): void {
  this.collezioneService.aggiungiFilm(film);
  alert(`"${film.title}" aggiunto alla collezione!`);
}

}
