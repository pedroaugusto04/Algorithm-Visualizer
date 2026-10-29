import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateGraphStructureComponent } from './create-graph-structure.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

describe('CreateGraphStructureComponent', () => {
  let component: CreateGraphStructureComponent;
  let fixture: ComponentFixture<CreateGraphStructureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateGraphStructureComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [provideNoopAnimations()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateGraphStructureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(false);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
