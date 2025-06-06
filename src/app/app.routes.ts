import { Routes } from '@angular/router';
import { InserimentoComponent } from './pages/inserimento/inserimento.component';
import { CollezioneComponent } from './pages/collezione/collezione.component';

export const routes: Routes = [
  { path: '', component: CollezioneComponent },
  { path: 'inserimento', component: InserimentoComponent },
  { path: 'collezione', component: CollezioneComponent }
];
