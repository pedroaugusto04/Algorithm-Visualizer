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
import { UserDTO } from 'src/app/models/DTO/User/UserDTO';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-sidebar',
  imports: [TablerIconsModule, MaterialModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {

  @Input() showToggle = true;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();
  user: UserDTO;

  constructor(private cookieService: CookieService, private userService: UserService, private router: Router) {}

  ngOnInit() {
    this.getUserLoggedIn();
  }


  getUserLoggedIn() {
    this.userService.getUserLoggedIn().subscribe({
      next:(user) => {
        this.user = user;
      }
    });
  }

  onLogOut(){
    this.cookieService.deleteAll();
    this.router.navigate(['/authentication/login']);
  }

  goToProfilePage() {
    this.router.navigate(['/profile']);
  }
}
