import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div class="container">
      <h1>TRANSFERS-MFE</h1>
      <p>This is the transfers-mfe micro-frontend</p>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
    }
  `]
})
export class AppComponent {
  title = 'transfers-mfe';
}