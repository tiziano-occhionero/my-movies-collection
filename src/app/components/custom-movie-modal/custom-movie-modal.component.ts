import { Component, Output, EventEmitter, AfterViewInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Film } from '../../models/film.model';
import { Modal } from 'bootstrap';
import { CollezioneService } from '../../services/collezione.service';

@Component({
  selector: 'app-custom-movie-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './custom-movie-modal.component.html',
  styleUrls: ['./custom-movie-modal.component.scss']
})
export class CustomMovieModalComponent implements AfterViewInit, OnDestroy {
  @Output() onFilmSave = new EventEmitter<Film>();

  film: Partial<Film> = {};
  isSaving = false;
  saveError = '';

  private modalInstance: Modal | null = null;
  private modalElement: HTMLElement | null = null;

  constructor(private collezioneService: CollezioneService) { }

  ngAfterViewInit(): void {
    this.modalElement = document.getElementById('customMovieModal');
    if (this.modalElement) {
      this.modalInstance = new Modal(this.modalElement);
    }
  }

  ngOnDestroy(): void {
    if (this.modalInstance) {
      this.modalInstance.dispose();
    }
  }

  open(film?: Film): void {
    this.isSaving = false;
    this.saveError = '';

    if (film) {
      // Modalità modifica: clona l'oggetto per evitare side-effects
      this.film = { ...film };
    } else {
      // Modalità inserimento: resetta il form
      this.film = {
        titolo: '',
        anno: undefined,
        formato: 'dvd',
        custodia: 'standard',
        posterUrl: ''
      };
    }

    if (this.modalInstance) {
      this.modalInstance.show();
    }
  }

  close(): void {
    if (this.modalInstance) {
      this.modalInstance.hide();
    }
  }

  save(): void {
    this.isSaving = true;
    this.saveError = '';

    const filmData = this.film as Film;

    const saveObs = this.film.id
      ? this.collezioneService.updateFilm(filmData) // MODIFICA
      : this.collezioneService.aggiungiFilmCustom(filmData); // INSERIMENTO

    saveObs.subscribe({
      next: (savedFilm) => {
        this.isSaving = false;
        this.onFilmSave.emit(savedFilm);
        this.close();
      },
      error: (err) => {
        console.error('Salvataggio fallito', err);
        this.isSaving = false;
        this.saveError = `Salvataggio fallito: ${err.message || 'Errore sconosciuto'}`;
      }
    });
  }
}
