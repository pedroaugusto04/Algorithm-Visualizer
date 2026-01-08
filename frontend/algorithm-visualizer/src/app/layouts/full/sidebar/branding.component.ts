import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CoreService } from 'src/app/services/core.service';

@Component({
  selector: 'app-branding',
  imports: [],
  template: `
    <div class="branding-desktop"
         (click)="goToHomePage()"
         style="cursor:pointer;">
      <img src="assets/favicon.ico" width="50" />
      <h1>Algorithm Visualizer</h1>
    </div>

    <div class="branding-mobile"
         (click)="goToHomePage()"
         style="cursor:pointer;">
      <img src="assets/favicon.ico" width="40" />
    </div>
  `,
  styles: [`

    .branding-desktop,
    .branding-mobile {
      align-items: center;
      color: white;
    }

    .branding-desktop {
      display: none;
    }

    .branding-mobile {
      display: flex;
    }

    @media (min-width: 576px) {
      .branding-desktop {
        display: flex;
      }

      .branding-mobile {
        display: none;
      }
    }

    h1 {
      margin: 0 0 0 8px;
      font-size: 1.5rem;
      white-space: nowrap;
    }
  `]
})
export class BrandingComponent {
  options = this.settings.getOptions();

  constructor(private settings: CoreService, private router: Router) { }


  goToHomePage() {
    this.router.navigate(['/home']);
  }
}
