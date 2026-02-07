import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { RedirectToLoginComponent } from './components/redirecttologin/redirecttologin.component';
import { LoginComponent } from './components/login/login.component';
import { LoginLayoutComponent } from './components/loginlayout/loginlayout.component';

@NgModule({
  declarations: [
    AppComponent,
    RedirectToLoginComponent,
    LoginComponent,
    LoginLayoutComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forRoot(routes)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }