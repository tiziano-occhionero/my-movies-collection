import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import Modal from 'bootstrap/js/dist/modal';

@Component({
  selector: 'app-logout-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logout-modal.component.html',
  styleUrls: ['./logout-modal.component.scss']
})
export class LogoutModalComponent {
  @Input() modalId: string = 'logoutModal';

  // Semplice, a prova di tipi mancanti di Bootstrap
  private modalInstance: any = null;

  @Output() confermato = new EventEmitter<void>();

  open(): void {
    const modalEl = document.getElementById(this.modalId);
    if (!modalEl) return;
    // usa getOrCreateInstance per evitare istanze duplicate
    this.modalInstance = Modal.getOrCreateInstance(modalEl);
    this.modalInstance.show();
  }

  close(): void {
    this.modalInstance?.hide();
  }

  confermaLogout(): void {
    this.confermato.emit();
    this.close();
  }
}
