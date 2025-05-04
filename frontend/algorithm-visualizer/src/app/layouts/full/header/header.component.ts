import {
  Component,
  Output,
  EventEmitter,
  Input,
  ViewEncapsulation,
  OnInit,
} from '@angular/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { BrandingComponent } from '../sidebar/branding.component';
import { CookieService } from 'ngx-cookie-service';
import { UserService } from 'src/app/services/user.service';
import { UserDTO } from 'src/app/models/DTO/User/UserDTO';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-header',
  imports: [
    RouterModule,
    CommonModule,
    NgScrollbarModule,
    TablerIconsModule,
    MaterialModule,
    BrandingComponent
  ],
  templateUrl: './header.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class HeaderComponent implements OnInit {
  @Input() showToggle = true;
  @Input() toggleChecked = false;
  @Output() toggleMobileNav = new EventEmitter<void>();
  user: UserDTO;

  constructor(private cookieService: CookieService, private userService: UserService, private router: Router,
    private authService: AuthService
  ){}

  ngOnInit() {
    this.userService.getUserLoggedIn().subscribe({
      next:(user) => {
        this.user = user;
      }
    })
  }

  onLogOut(){
    this.authService.logoutUser();
  }

  onLogin() {
    this.router.navigate(['/authentication/login'])
  }

  goToProfilePage() {
    this.router.navigate(['/profile']);
  }
}