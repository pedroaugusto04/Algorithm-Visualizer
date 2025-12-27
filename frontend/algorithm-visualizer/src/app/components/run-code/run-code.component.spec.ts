import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RunCodeComponent } from './run-code.component';

describe('RunCodeComponent', () => {
  let component: RunCodeComponent;
  let fixture: ComponentFixture<RunCodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RunCodeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RunCodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
