import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CanvasOverviewComponent } from './canvas-overview.component';

describe('OverviewComponent', () => {
  let component: CanvasOverviewComponent;
  let fixture: ComponentFixture<CanvasOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CanvasOverviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CanvasOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
