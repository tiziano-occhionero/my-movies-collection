import { Routes } from '@angular/router';
import { InserimentoComponent } from './pages/inserimento/inserimento.component';
import { CollezioneComponent } from './pages/collezione/collezione.component';
import { ListaDesideriComponent } from './pages/lista-desideri/lista-desideri.component';

export const routes: Routes = [
  { path: '', component: CollezioneComponent },
  { path: 'inserimento', component: InserimentoComponent },
  { path: 'collezione', component: CollezioneComponent },
  { path: 'lista-desideri', component: ListaDesideriComponent }
];
