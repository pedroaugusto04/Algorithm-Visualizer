import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CookieService } from 'ngx-cookie-service';
import { MaterialModule } from 'src/app/material.module';

@Component({
  selector: 'app-sidebar',
  imports: [TablerIconsModule, MaterialModule, RouterModule],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {

  @Input() showToggle = true;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();

  constructor(private cookieService: CookieService, private router: Router) {}

  onLogOut(){
    this.cookieService.deleteAll();
    this.router.navigate(['/authentication/login']);
  }
}
