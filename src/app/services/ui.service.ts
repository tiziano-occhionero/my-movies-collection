import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UiService {
  private inserimentoManualeSource = new Subject<void>();

  inserimentoManuale$ = this.inserimentoManualeSource.asObservable();

  triggerInserimentoManuale(): void {
    this.inserimentoManualeSource.next();
  }
}
