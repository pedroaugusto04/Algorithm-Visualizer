import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppStructureVisualizerComponent } from './app-structure-visualizer.component';

describe('AppStructureVisualizerComponent', () => {
  let component: AppStructureVisualizerComponent;
  let fixture: ComponentFixture<AppStructureVisualizerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppStructureVisualizerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppStructureVisualizerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
