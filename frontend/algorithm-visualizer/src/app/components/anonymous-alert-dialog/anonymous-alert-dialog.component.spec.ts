import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnonymousAlertDialogComponent } from './anonymous-alert-dialog.component';

describe('AnonymousAlertDialogComponent', () => {
  let component: AnonymousAlertDialogComponent;
  let fixture: ComponentFixture<AnonymousAlertDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnonymousAlertDialogComponent]
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
