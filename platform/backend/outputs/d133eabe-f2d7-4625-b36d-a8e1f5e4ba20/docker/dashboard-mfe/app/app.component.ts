import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div class="container">
      <h1>DASHBOARD-MFE</h1>
      <p>This is the dashboard-mfe micro-frontend</p>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
    }
  `]
})
export class AppComponent {
  title = 'dashboard-mfe';
}