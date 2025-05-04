import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MaterialModule } from '../../material.module';
import { GraphStructure } from 'src/app/models/GraphStructure';
import { GraphStrategy } from 'src/app/models/GraphStrategy/GraphStrategy';
import { GraphStrategyUndirectedWeighted } from 'src/app/models/GraphStrategy/GraphStreategyUndirectedWeighted';
import { GraphService } from 'src/app/services/graph.service';
import * as d3 from 'd3';

@Component({
  selector: 'app-starter',
  imports: [
    MaterialModule,
  ],
  templateUrl: './starter.component.html',
  styleUrl: './starter.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class StarterComponent {
  // animacao em loop para demonstracao ( no caso, BFS)

  graphStrategy: GraphStrategy;
  // grafo mockado
  graph: GraphStructure = {
    directed: false,
    weighted: true,
    items: [
      { text: '0 1 4' },
      { text: '0 7 8' },
      { text: '1 7 11' },
      { text: '1 2 8' },
      { text: '2 3 7' },
      { text: '2 5 4' },
      { text: '3 5 14' },
      { text: '7 8 7' },
      { text: '2 8 2' },
      { text: '3 4 9' },
      { text: '4 5 10' },
      { text: '6 7 1' },
      { text: '6 8 6' },
      { text: '5 6 2' },
    ],
  };
  // execuionMap mocado para bfs
  executionMap: any = {
    1: [{ value: 0 }],
    2: [{ value: 1 }, { value: 7 }],
    3: [{ value: 2 }, { value: 8 }, { value: 6 }],
    4: [{ value: 3 }, { value: 5 }],
    5: [{ value: 4 }],
  };
  @ViewChild('graphSeeContainer', { static: true }) graphContainer!: ElementRef<HTMLDivElement>;
  svg: any;

  constructor(private graphService: GraphService) { }

  ngOnInit() {
    this.graphStrategy = new GraphStrategyUndirectedWeighted(this.graphService);

    this.graphStrategy.renderizeGraph(this.svg, this.graph.items, this.graphContainer);

    this.runAlgorithm();
  }

  runAlgorithm(): void {

    this.resetAlgorithm();

    const executionMap = this.executionMap;

    const timeout: number = 1000;

    const sortedTimes = Object.keys(executionMap)
      .map(k => Number(k))
      .sort((a, b) => a - b);

    for (const time of sortedTimes) {
      const nodeIds = Array.isArray(executionMap[time])
        ? executionMap[time].map((item: any) => Number(item.value))
        : [];

      const timeoutId = window.setTimeout(() => {

        const allD3Nodes = d3.select(this.graphContainer.nativeElement)
          .select('svg')
          .selectAll('circle');

        allD3Nodes
          .filter((d: any) => nodeIds.includes(d.id))
          .transition()
          .duration(300)
          .attr('fill', 'orange');

      }, time * timeout);
    }

    // executa apos a finalizacao do algoritmo 
    const maxTime = sortedTimes[sortedTimes.length - 1] ?? 0;
    const finalTimeoutId = window.setTimeout(() => {
      this.runAlgorithm();
    }, maxTime * timeout + 1000);

  }

  resetAlgorithm(): void {
      const allD3Nodes = d3.select(this.graphContainer.nativeElement)
        .select('svg')
        .selectAll('circle');
  
      allD3Nodes
        .transition()
        .duration(300)
        .attr('fill', 'steelblue');
    }
}