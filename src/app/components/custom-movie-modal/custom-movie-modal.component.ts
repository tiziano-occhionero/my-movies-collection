import { Component, Output, EventEmitter, AfterViewInit, OnDestroy } from '@angular/core';
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
export class CustomMovieModalComponent implements AfterViewInit, OnDestroy {
  @Output() onFilmSave = new EventEmitter<Film>();

  film: Partial<Film> = {
    titolo: '',
    anno: undefined,
    formato: 'dvd',
    custodia: 'standard',
    posterUrl: ''
  };

  private modalInstance: Modal | null = null;
  private modalElement: HTMLElement | null = null;

  constructor() { }

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

  open(): void {
    if (this.modalInstance) {
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
