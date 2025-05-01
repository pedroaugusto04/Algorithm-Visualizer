import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeeGraphStructureComponent } from './see-graph-structure.component';

describe('SeeGraphStructureComponent', () => {
  let component: SeeGraphStructureComponent;
  let fixture: ComponentFixture<SeeGraphStructureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeeGraphStructureComponent]
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
