import { Routes } from '@angular/router';
import { InserimentoComponent } from './pages/inserimento/inserimento.component';
import { CercaComponent } from './pages/cerca/cerca.component';

export const routes: Routes = [
  { path: '', redirectTo: 'inserimento', pathMatch: 'full' },
  { path: 'inserimento', component: InserimentoComponent },
  { path: 'cerca', component: CercaComponent }
];
