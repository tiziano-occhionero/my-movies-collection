import { Component, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Film } from '../../models/film.model';
import Modal from 'bootstrap/js/dist/modal';

@Component({
  selector: 'app-custom-movie-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './custom-movie-modal.component.html',
  styleUrls: ['./custom-movie-modal.component.scss']
})
export class CustomMovieModalComponent {
  @Output() onFilmSave = new EventEmitter<Film>();

  film: Partial<Film> = {
    titolo: '',
    anno: undefined,
    formato: 'dvd',
    custodia: 'standard',
    posterUrl: ''
  };

  private modalInstance: any | null = null;

  constructor() { }

  open(): void {
    const modalElement = document.getElementById('customMovieModal');
    if (modalElement) {
      this.modalInstance = new Modal(modalElement);
      this.modalInstance.show();
    }
  }

  close(): void {
    if (this.modalInstance) {
      this.modalInstance.hide();
    }
  }

  saveToCollezione(): void {
    this.film.provenienza = 'collezione';
    this.onFilmSave.emit(this.film as Film);
    this.close();
  }

  saveToWishlist(): void {
    this.film.provenienza = 'lista-desideri';
    this.onFilmSave.emit(this.film as Film);
    this.close();
  }
}
