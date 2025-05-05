import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { ActivatedRoute } from '@angular/router';
import * as d3 from 'd3';
import { AlgorithmOptions } from 'src/app/models/AlgorithmOptions';
import { GraphStrategy } from 'src/app/models/GraphStrategy/GraphStrategy';
import { GraphStrategyFactory } from 'src/app/models/GraphStrategy/GraphStrategyFactory';
import { AlgorithmService } from 'src/app/services/algorithm.service';
import { GraphService } from 'src/app/services/graph.service';
import { SnackBarService } from 'src/app/services/utils/snack-bar.service';

@Component({
  selector: 'app-see-graph-structure',
  imports: [MatSelectModule, MatButtonModule,CommonModule],
  templateUrl: './see-graph-structure.component.html',
  styleUrl: './see-graph-structure.component.scss'
})
export class SeeGraphStructureComponent implements OnInit {

  @ViewChild('graphSeeContainer', { static: true }) graphContainer!: ElementRef<HTMLDivElement>;
  svg: any;
  graphId: string | null = null;
  algorithmOptions: AlgorithmOptions[];
  selectedAlgorithmId: string;
  executionMap: any;
  isAlgorithmExecuting: boolean = false;
  isStopActive: boolean = false;
  currentExecutionTime: number = 0;
  private timeoutIds: number[] = [];

  // graph strategy (to renderize correct graph for options choosed)
  graphStrategy: GraphStrategy;

  constructor(private route: ActivatedRoute, private graphService: GraphService,
    private graphStrategyFactory: GraphStrategyFactory, private algorithmService: AlgorithmService,
    private snackBarService: SnackBarService
  ) { }

  ngOnInit(): void {

    this.route.paramMap.subscribe((params) => {

      this.graphId = params.get('graphId');

      this.algorithmService.getSupportedAlgorithmsByDataStructure(this.graphId || "").subscribe({
        next: (data) => {
          this.algorithmOptions = data;
          this.selectedAlgorithmId = this.algorithmOptions[0].id;
        },
        error: () => {
          this.snackBarService.showSnackBarError("Internal error while recovering supported algorithms");
        }
      });

      this.graphService.getGraphById(this.graphId || "").subscribe({
        next: (graph) => {
          this.graphStrategy = this.graphStrategyFactory.getGraphStrategy(graph.directed, graph.weighted);

          this.graphStrategy.renderizeGraph(this.svg, graph.items, this.graphContainer);

        },
        error: () => {
          this.snackBarService.showSnackBarError("Internal error while recovering graph");
        }
      })
    });
  }


  executeAlgorithm() {
    this.isAlgorithmExecuting = !this.isAlgorithmExecuting;

    if (!this.isAlgorithmExecuting) {
      this.stopAlgorithm();
      return;
    }

    // start algorithm
    this.algorithmService.executeGraphAlgorithm(this.graphId || "", this.selectedAlgorithmId || "").subscribe({
      next: (data) => {
        this.executionMap = data;

        this.runAlgorithm();

      },
      error: () => {
        this.snackBarService.showSnackBarError("Internal error while running algorithm");
        this.isAlgorithmExecuting = false;
      }
    });
  }


  runAlgorithm(): void {

    if (this.isStopActive) {
      this.isStopActive = false;
    } else {
      this.resetAlgorithm();
    }

    this.isAlgorithmExecuting = true;

    const executionMap = this.executionMap['executionMap'];
    const mapDistances = this.executionMap['mapDistances'];

    const timeout:number = 1000;

    const sortedTimes = Object.keys(executionMap)
      .map(k => Number(k))
      .sort((a, b) => a - b);

    // em caso de stop, comeca a partir de onde pausou
    const startTimeIndex = sortedTimes.findIndex(time => time >= this.currentExecutionTime);
    const remainingTimes = sortedTimes.slice(startTimeIndex);

    for (const time of remainingTimes) {
      const nodeIds = Array.isArray(executionMap[time])
        ? executionMap[time].map((item: any) => Number(item.value))
        : [];

      const timeoutId = window.setTimeout(() => {
        if (!this.isAlgorithmExecuting) return;

        const allD3Nodes = d3.select(this.graphContainer.nativeElement)
          .select('svg')
          .selectAll('circle');

        allD3Nodes
          .filter((d: any) => nodeIds.includes(d.id))
          .transition()
          .duration(300)
          .attr('fill', 'orange');

        // renderiza o vetor de distancia ( se existir )
        if (mapDistances && mapDistances[time]) {
          const container = d3.select('#distance-display');

          container.selectAll('*').remove();

          for (const distArray of mapDistances[time]) {
            const formatted = distArray
              .map((d: any) => (d >= Number.MAX_SAFE_INTEGER ? '∞' : d))
              .join(' | ');

            container.append('div')
              .style('margin', '5px 0')
              .style('font-family', 'monospace')
              .text(`Distance Array: [ ${formatted} ]`);
          }
        }

        this.currentExecutionTime = time;

      }, (time - this.currentExecutionTime) * timeout);

      this.timeoutIds.push(timeoutId);
    }

    // executa apos a finalizacao do algoritmo 
    const maxTime = sortedTimes[sortedTimes.length - 1] ?? 0;
    const finalTimeoutId = window.setTimeout(() => {
      this.isAlgorithmExecuting = false;
      this.isStopActive = false;
      this.currentExecutionTime = 0;
    }, (maxTime-this.currentExecutionTime) * timeout + 1000);

    this.timeoutIds.push(finalTimeoutId);
  }

  stopAlgorithm(): void {
    this.isAlgorithmExecuting = false;
    this.isStopActive = true;
  
    this.timeoutIds.forEach(id => clearTimeout(id));
    this.timeoutIds = [];
  
  }

  resetAlgorithm(): void {
    this.isAlgorithmExecuting = false;
    this.isStopActive = true;
    this.currentExecutionTime = 0;

    this.timeoutIds.forEach(id => clearTimeout(id));
    this.timeoutIds = [];

    const allD3Nodes = d3.select(this.graphContainer.nativeElement)
      .select('svg')
      .selectAll('circle');

    allD3Nodes
      .transition()
      .duration(300)
      .attr('fill', 'steelblue');

    const container = d3.select('#distance-display');
    container.selectAll('*').remove();
  }

  onSelectedAlgorithmChange(event: MatSelectChange) {
    this.resetAlgorithm();
  }
}