import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute } from '@angular/router';
import { AlgorithmOptions } from 'src/app/models/AlgorithmOptions';
import { GraphStrategy } from 'src/app/models/GraphStrategy/GraphStrategy';
import { GraphStrategyFactory } from 'src/app/models/GraphStrategy/GraphStrategyFactory';
import { AlgorithmService } from 'src/app/services/algorithm.service';
import { GraphService } from 'src/app/services/graph.service';

@Component({
  selector: 'app-see-graph-structure',
  imports: [MatSelectModule],
  templateUrl: './see-graph-structure.component.html',
  styleUrl: './see-graph-structure.component.scss'
})
export class SeeGraphStructureComponent implements OnInit {
  
  @ViewChild('graphSeeContainer', { static: true }) graphContainer!: ElementRef<HTMLDivElement>;
  svg: any;
  graphId: string | null = null;
  algorithmOptions: AlgorithmOptions[];
  selectedAlgorithmId: number;

  // graph strategy (to renderize correct graph for options choosed)
  graphStrategy: GraphStrategy;

  constructor(private route: ActivatedRoute, private graphService: GraphService,
    private graphStrategyFactory: GraphStrategyFactory, private algorithmService: AlgorithmService
  ) {}

  ngOnInit(): void {

    this.route.paramMap.subscribe((params) => {

      this.graphId = params.get('graphId');

      this.algorithmService.getSupportedAlgorithmsByDataStructure(this.graphId || "").subscribe({
        next:(data) => {
          this.algorithmOptions = data;
        },
        error:() => {
          
        }
      });

      this.graphService.getGraphById(this.graphId || "").subscribe({
        next:(graph) => {

          this.graphStrategy = this.graphStrategyFactory.getGraphStrategy(graph.directed,graph.weighted);

          this.graphStrategy.renderizeGraph(this.svg,graph.items,this.graphContainer);
          
        },
        error:() => {

        }
      })
    });
  }
}
