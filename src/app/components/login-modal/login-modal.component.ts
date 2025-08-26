import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="modal fade show d-block" tabindex="-1" role="dialog" *ngIf="visible" style="background: rgba(0,0,0,.35);">
    <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content rounded-3">
        <div class="modal-header">
          <h5 class="modal-title">Accesso richiesto</h5>
          <button type="button" class="btn-close" (click)="close()"></button>
        </div>
        <div class="modal-body">
          <div *ngIf="error" class="alert alert-danger">{{ error }}</div>

          <form (ngSubmit)="onSubmit()" #f="ngForm">
            <div class="mb-3">
              <label class="form-label">Username</label>
              <input class="form-control" name="username" [(ngModel)]="username" required />
            </div>
            <div class="mb-3">
              <label class="form-label">Password</label>
              <input type="password" class="form-control" name="password" [(ngModel)]="password" required />
            </div>
            <button class="btn btn-primary" [disabled]="f.invalid">Accedi</button>
          </form>
        </div>
      </div>
    </div>
  </div>
  `,
})
export class LoginModalComponent {
  @Output() loggedIn = new EventEmitter<{ username: string; password: string }>();

  visible = false;
  username = '';
  password = '';
  error: string | null = null;

  open() { this.visible = true; this.error = null; }
  close() { this.visible = false; }

  onSubmit() {
    const u = (this.username || '').trim();
    const p = (this.password || '').trim();
    this.loggedIn.emit({ username: u, password: p });
  }


}
