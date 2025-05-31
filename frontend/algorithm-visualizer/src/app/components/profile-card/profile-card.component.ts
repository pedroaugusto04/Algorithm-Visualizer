import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { Observable } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { ProfileDTO } from 'src/app/models/DTO/User/ProfileDTO';
import { ProfileService } from 'src/app/services/profile.service';

@Component({
  selector: 'app-profile-card',
  imports: [MaterialModule, TablerIconsModule,CommonModule],
  templateUrl: './profile-card.component.html',
  styleUrl: './profile-card.component.scss'
})
export class AppProfileCardComponent implements OnInit{

  profile$: Observable<ProfileDTO>;

  constructor(private profileService: ProfileService) { }


  ngOnInit() {
    this.profile$ = this.profileService.getProfileInfo();
  }

  formatDateToMDY(isoDateString: string): string {
    const date = new Date(isoDateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }
}
