import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CoreService } from 'src/app/services/core.service';

@Component({
  selector: 'app-branding',
  imports: [],
  template: `
  <div class="branding d-none d-lg-flex align-items-center"
   (click)="goToHomePage()" 
       style="cursor: pointer;">
    <img src="assets/favicon.ico" alt="Logo" width="50" height="50" style="margin-right: 7px;">
    <h1 style="color: white">Algorithm Visualizer</h1>
  </div>
`,
})
export class BrandingComponent {
  options = this.settings.getOptions();

  constructor(private settings: CoreService, private router: Router) { }


  goToHomePage() {
    this.router.navigate(['/home']);
  }
}
