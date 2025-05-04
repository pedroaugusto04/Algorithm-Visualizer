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

  }
}
