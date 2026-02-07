import { Routes } from '@angular/router';
import { RedirectToLoginComponent } from './components/redirecttologin/redirecttologin.component';
import { LoginComponent } from './components/login/login.component';
import { LoginLayoutComponent } from './components/loginlayout/loginlayout.component';

export const routes: Routes = [
  { path: '', redirectTo: '/redirecttologin', pathMatch: 'full' },
  { path: 'redirecttologin', component: RedirectToLoginComponent },
  { path: 'login', component: LoginComponent },
  { path: 'loginlayout', component: LoginLayoutComponent }
];