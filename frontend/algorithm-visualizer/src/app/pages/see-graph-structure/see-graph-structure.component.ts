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
    this.algorithmService.executeGraphAlgorithm(this.graphId || "", this.selectedAlgorithmId || "").subscribe({
      next: (data) => {
        this.executionMap = data;

        this.renderizeAlgorithmExecution(this.executionMap);
      },
      error: () => {
        this.snackBarService.showSnackBarError("Internal error while running algorithm");
      }
    });
  }


  renderizeAlgorithmExecution(executionMap: any): void {

    const allNodes = d3.select(this.graphContainer.nativeElement)
      .select('svg')
      .selectAll('circle');

    const sortedTimes = Object.keys(executionMap['executionMap'])
      .map(k => Number(k))
      .sort((a, b) => a - b);

    for (const time of sortedTimes) {
      const nodeIds = Array.isArray(executionMap['executionMap'][time])
        ? executionMap['executionMap'][time].map((item: any) => Number(item.value))
        : [];

      setTimeout(() => {
        const allNodes = d3.select(this.graphContainer.nativeElement)
          .select('svg')
          .selectAll('circle');

        allNodes
          .filter((d: any) => nodeIds.includes(d.id))
          .transition()
          .duration(300)
          .attr('fill', 'orange');
      }, time * 800);

      // reseta apos a execucao
      const lastTime = sortedTimes[sortedTimes.length - 1];
      setTimeout(() => {
        allNodes
          .transition()
          .duration(300)
          .attr('fill', 'steelblue');
      }, (lastTime + 1) * 800);
    }

  }
}
