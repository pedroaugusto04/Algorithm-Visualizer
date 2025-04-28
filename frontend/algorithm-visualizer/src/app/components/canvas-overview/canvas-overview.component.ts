import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import {
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexLegend,
  ApexStroke,
  ApexTooltip,
  ApexAxisChartSeries,
  ApexXAxis,
  ApexYAxis,
  ApexGrid,
  ApexPlotOptions,
  ApexFill,
  ApexMarkers,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { MaterialModule } from 'src/app/material.module';

@Component({
  selector: 'app-canvas-overview',
  imports: [NgApexchartsModule, TablerIconsModule, MaterialModule],
  templateUrl: './canvas-overview.component.html',
  styleUrl: './canvas-overview.component.scss'
})
export class CanvasOverviewComponent implements AfterViewInit {
  @ViewChild('myCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  constructor() {}

  ngAfterViewInit(): void {
    this.drawGraph();
  }

  drawGraph() {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');

    if (ctx) {

      const nodes = [
        { x: 100, y: 100, filled: false },
        { x: 200, y: 80, filled: false },
        { x: 300, y: 150, filled: false },
        { x: 400, y: 100, filled: false },
        { x: 500, y: 200, filled: false },
      ];

      const edges = [
        { from: 0, to: 1, weight: 5 },
        { from: 1, to: 2, weight: 8 },
        { from: 2, to: 3, weight: 3 },
        { from: 3, to: 4, weight: 2 },
        { from: 0, to: 2, weight: 7 },
        { from: 1, to: 3, weight: 4 }
      ];

      const drawGraph = () => {

        for (const edge of edges) {
          const from = nodes[edge.from];
          const to = nodes[edge.to];

          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.stroke();

          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;
          ctx.fillText(edge.weight.toString(), midX, midY+13);
        }

        ctx.strokeStyle = 'black';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (const node of nodes) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, 15, 0, Math.PI * 2);
          ctx.fillStyle = node.filled ? 'green' : 'white'; 
          ctx.fill();
          ctx.strokeStyle = 'black';
          ctx.stroke();
        }
      };

      let currentNode = 0;

      const animateFill = () => {
        if (currentNode < nodes.length) {
          nodes[currentNode].filled = true; 
          drawGraph(); 
          currentNode++;
          setTimeout(animateFill, 500); 
        }
      };

      drawGraph();

      setTimeout(animateFill, 1000); 
    }
  }
}
