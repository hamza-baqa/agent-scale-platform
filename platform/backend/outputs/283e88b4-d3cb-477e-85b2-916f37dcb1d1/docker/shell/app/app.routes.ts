import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'main',
    loadChildren: () => import('main-mfe/Module').then(m => m.RemoteEntryModule)
  },
  {
    path: 'auth',
    loadChildren: () => import('auth-mfe/Module').then(m => m.RemoteEntryModule)
  },
  { path: '**', redirectTo: '/login' }
];