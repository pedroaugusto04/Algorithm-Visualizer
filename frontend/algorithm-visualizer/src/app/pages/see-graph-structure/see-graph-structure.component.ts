import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
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
  imports: [MatSelectModule, MatButtonModule],
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

    const sortedTimes = Object.keys(this.executionMap['executionMap'])
      .map(k => Number(k))
      .sort((a, b) => a - b);

    for (const time of sortedTimes) {
      const nodeIds = Array.isArray(this.executionMap['executionMap'][time])
        ? this.executionMap['executionMap'][time].map((item: any) => Number(item.value))
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
      }, time * 800);

      this.timeoutIds.push(timeoutId);
    }

    const maxTime = sortedTimes[sortedTimes.length - 1] ?? 0;
    const finalTimeoutId = window.setTimeout(() => {
      if (this.isAlgorithmExecuting) {
        this.stopAlgorithm();
      }
    }, maxTime * 800 + 1000); 
    this.timeoutIds.push(finalTimeoutId);
  }

  stopAlgorithm(): void {

    this.isAlgorithmExecuting = false;

    this.timeoutIds.forEach(id => clearTimeout(id));
    this.timeoutIds = [];

    const allD3Nodes = d3.select(this.graphContainer.nativeElement)
      .select('svg')
      .selectAll('circle');

    allD3Nodes
      .transition()
      .duration(300)
      .attr('fill', 'steelblue');
  }
}