import { Routes } from '@angular/router';
import { IndexComponent } from './components/index/index.component';
import { LoginComponent } from './components/login/login.component';
import { VirementsComponent } from './components/virements/virements.component';

export const routes: Routes = [
  { path: '', redirectTo: '/', pathMatch: 'full' },
  { path: '', component: IndexComponent },
  { path: 'login', component: LoginComponent },
  { path: 'virements', component: VirementsComponent },
  { path: '**', redirectTo: '/' }
];