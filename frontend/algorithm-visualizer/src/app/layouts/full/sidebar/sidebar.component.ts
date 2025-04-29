import {
  Component,
  EventEmitter,
  Input,
  OnInit,
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
export class SidebarComponent implements OnInit {

  @Input() showToggle = true;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();

  constructor(private cookieService: CookieService, private router: Router) {}

  ngOnInit(): void {}

  onLogOut(){
    this.cookieService.deleteAll();
    this.router.navigate(['/authentication/login']);
  }
}
