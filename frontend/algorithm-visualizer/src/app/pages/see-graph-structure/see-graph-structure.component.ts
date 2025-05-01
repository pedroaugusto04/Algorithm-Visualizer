import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GraphStrategy } from 'src/app/models/GraphStrategy/GraphStrategy';
import { GraphStrategyFactory } from 'src/app/models/GraphStrategy/GraphStrategyFactory';
import { GraphService } from 'src/app/services/graph.service';

@Component({
  selector: 'app-see-graph-structure',
  imports: [],
  templateUrl: './see-graph-structure.component.html',
  styleUrl: './see-graph-structure.component.scss'
})
export class SeeGraphStructureComponent implements OnInit {
  
  @ViewChild('graphSeeContainer', { static: true }) graphContainer!: ElementRef<HTMLDivElement>;
  svg: any;
  graphId: string | null = null;

  // graph strategy (to renderize correct graph for options choosed)
  graphStrategy: GraphStrategy;

  constructor(private route: ActivatedRoute, private graphService: GraphService,
    private graphStrategyFactory: GraphStrategyFactory
  ) {}

  ngOnInit(): void {

    this.route.paramMap.subscribe((params) => {

      this.graphId = params.get('graphId');

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
