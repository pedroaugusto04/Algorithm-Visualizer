import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnonymousAlertDialogComponent } from './anonymous-alert-dialog.component';
import { MatDialogRef } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';

describe('AnonymousAlertDialogComponent', () => {
  let component: AnonymousAlertDialogComponent;
  let fixture: ComponentFixture<AnonymousAlertDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnonymousAlertDialogComponent, RouterTestingModule],
      providers: [{ provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } }]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnonymousAlertDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
