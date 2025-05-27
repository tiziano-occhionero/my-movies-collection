import { Component, OnInit } from '@angular/core';
import { RicercaService } from '../../services/ricerca.service';
import { CommonModule } from '@angular/common';



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

  constructor(private ricercaService: RicercaService) {}

  ngOnInit(): void {
    this.ricercaService.risultatiApi$.subscribe((risultati) => {
      this.film = risultati;
      this.ricercaEffettuata = true;
    });
  }
}
