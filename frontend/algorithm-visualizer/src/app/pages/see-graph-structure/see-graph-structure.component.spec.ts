import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeeGraphStructureComponent } from './see-graph-structure.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

describe('SeeGraphStructureComponent', () => {
  let component: SeeGraphStructureComponent;
  let fixture: ComponentFixture<SeeGraphStructureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeeGraphStructureComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [provideNoopAnimations()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeeGraphStructureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
