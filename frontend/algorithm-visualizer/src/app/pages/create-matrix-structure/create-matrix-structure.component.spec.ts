import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateMatrixStructureComponent } from './create-matrix-structure.component';

describe('CreateMatrixStructureComponent', () => {
  let component: CreateMatrixStructureComponent;
  let fixture: ComponentFixture<CreateMatrixStructureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateMatrixStructureComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateMatrixStructureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
