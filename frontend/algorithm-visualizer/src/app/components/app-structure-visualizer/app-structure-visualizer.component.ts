import {
  Component,
  Input,
  ElementRef,
  AfterViewInit,
  ViewChild,
  SimpleChanges,
  OnChanges
} from '@angular/core';
import * as d3 from 'd3';
import { StructureWindow } from 'src/app/models/StructureWindow';

@Component({
  selector: 'app-structure-visualizer',
  standalone: true,
  templateUrl: './app-structure-visualizer.component.html',
  styleUrls: ['./app-structure-visualizer.component.scss']
})
export class StructureVisualizerComponent implements AfterViewInit, OnChanges {

  @ViewChild('graphContainer', { static: true }) graphContainer!: ElementRef<HTMLDivElement>;
  svg: any;
  @Input() struct!: StructureWindow;

  ngAfterViewInit() {
    setTimeout(() => {
      this.renderizeSvg();
    }, 0);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['struct']) {
      this.destroy();
      this.renderizeSvg();
    }
  }

  renderizeSvg(): void {
    if (!this.struct) return;

    const container = this.graphContainer.nativeElement;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    d3.select(container).selectAll('svg').remove();

    const nodes = this.struct.d3Data?.nodes;
    const links = this.struct.d3Data?.links;

    this.svg = d3.select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%');

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));
      
    this.struct.d3Data = {
      nodes: nodes || [],
      links: links || [],
      simulation: simulation,
      svg: this.svg,
      width: width,
      height: height
    };
  }

  private destroy() {
    d3.select(this.graphContainer.nativeElement).selectAll('*').remove();
  }

}