import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StructureVisualizerComponent } from './app-structure-visualizer.component';
import { StructureWindow } from 'src/app/models/StructureWindow';
import { GlobalRenderer } from 'src/app/services/renderers/GlobalRenderer';

describe('StructureVisualizerComponent', () => {
  let component: StructureVisualizerComponent;
  let fixture: ComponentFixture<StructureVisualizerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StructureVisualizerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StructureVisualizerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('opens a nested inspector from an array cell and marks fields changed by the next snapshot', async () => {
    const struct: StructureWindow = {
      path: 'nodes',
      type: 'array',
      children: [],
      d3Data: {
        arrayData: [{ name: 'a', edge: { to: 2, weight: 7 } }],
        nodes: [],
        links: [],
        simulation: null,
        svg: null,
        width: 800,
        height: 600
      }
    };
    fixture.componentRef.setInput('struct', struct);
    fixture.detectChanges();
    await fixture.whenStable();

    const cell = fixture.nativeElement.querySelector('.array-cell') as SVGGElement;
    expect(cell).toBeTruthy();
    cell.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.structured-inspector')).toBeTruthy();
    const labels = Array.from(fixture.nativeElement.querySelectorAll('.tree-label'))
      .map((label: any) => label.textContent.trim());
    expect(labels).toContain('edge');
    expect(labels).toContain('weight');

    struct.d3Data!.arrayData = [{ name: 'a', edge: { to: 2, weight: 9 } }];
    TestBed.inject(GlobalRenderer).renderElements([struct]);
    fixture.detectChanges();

    const changedValue = fixture.nativeElement.querySelector('.changed-value');
    expect(changedValue).toBeTruthy();
    expect(changedValue.textContent).toContain('9');
  });
});
