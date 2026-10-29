import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoogleSigninComponent } from './google-signin.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

describe('GoogleSigninComponent', () => {
  let component: GoogleSigninComponent;
  let fixture: ComponentFixture<GoogleSigninComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GoogleSigninComponent, HttpClientTestingModule, RouterTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GoogleSigninComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
