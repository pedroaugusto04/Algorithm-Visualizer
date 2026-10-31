import {
  Component,
  Input,
  ElementRef,
  AfterViewInit,
  ViewChild,
  SimpleChanges,
  OnChanges,
  OnDestroy,
  inject,
  NgZone
} from '@angular/core';
import * as d3 from 'd3';
import { StructureWindow } from 'src/app/models/StructureWindow';
import { GlobalRenderer } from '../../services/renderers/GlobalRenderer';
import { JsonValueTreeComponent } from '../json-value-tree/json-value-tree.component';
import { JsonValueTreeNode, projectJsonValueTree } from '../../services/renderers/json-value-tree';
import { StructuredValueSelection } from '../../models/StructuredValueSelection';
import { JsonValue } from '../../models/ExecutionLogEntry';

@Component({
  selector: 'app-structure-visualizer',
  standalone: true,
  imports: [JsonValueTreeComponent],
  templateUrl: './app-structure-visualizer.component.html',
  styleUrls: ['./app-structure-visualizer.component.scss']
})
export class StructureVisualizerComponent implements AfterViewInit, OnChanges, OnDestroy {

  @ViewChild('graphContainer', { static: true }) graphContainer!: ElementRef<HTMLDivElement>;
  svg: any;
  @Input() struct!: StructureWindow;

  private resizeObserver: ResizeObserver | null = null;
  private renderedWidth = 0;
  private renderedHeight = 0;
  private globalRenderer = inject(GlobalRenderer);
  private zone = inject(NgZone);
  selectedValueTree: JsonValueTreeNode | null = null;
  hoveredNodeTooltip: { title: string; path: string; tree: JsonValueTreeNode; left: number; top: number } | null = null;

  ngAfterViewInit() {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.resizeVisualizer());
      this.resizeObserver.observe(this.graphContainer.nativeElement);
    }
    setTimeout(() => {
      this.resizeVisualizer();
    }, 0);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.struct?.d3Data?.simulation?.stop();
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
    const bounds = container.getBoundingClientRect();
    const isGraph = this.struct.viewMode === 'graph';
    const width = bounds.width || (isGraph ? 0 : 800);
    const height = bounds.height || (isGraph ? 0 : 600);
    if (width <= 0 || height <= 0) return;

    d3.select(container).selectAll('svg').remove();

    const nodes = this.struct.d3Data?.nodes;
    const links = this.struct.d3Data?.links;

    this.svg = d3.select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'none')
      .style('position', 'absolute')
      .style('inset', '0')
      .style('display', 'block');
    this.renderedWidth = width;
    this.renderedHeight = height;

    const simulation = isGraph
      ? d3.forceSimulation(nodes)
          .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
          .force('charge', d3.forceManyBody().strength(-300))
          .force('center', d3.forceCenter(width / 2, height / 2))
      : null;
      
    this.struct.d3Data = {
      ...this.struct.d3Data,
      ownerPath: this.struct.path,
      onStructuredValueSelected: (selection: StructuredValueSelection | null) => {
        this.zone.run(() => this.updateSelectedValue(selection));
      },
      onNodeHover: (node: any, event: MouseEvent | null) => {
        if (!node || !event) {
          this.zone.run(() => this.hoveredNodeTooltip = null);
          return;
        }
        const bounds = container.getBoundingClientRect();
        const width = Math.min(360, Math.max(180, bounds.width - 24));
        const height = Math.min(280, Math.max(120, bounds.height - 24));
        const value = node.structuredValue !== undefined ? node.structuredValue : node.value;
        const title = String(node.id ?? node.value ?? 'Node');
        const path = String(node.structuredValuePath ?? node.id ?? 'value');
        const tree = projectJsonValueTree('value', path, value as JsonValue);
        const left = Math.max(12, Math.min(event.clientX - bounds.left + 14, bounds.width - width - 12));
        const top = Math.max(12, Math.min(event.clientY - bounds.top + 14, bounds.height - height - 12));
        this.zone.run(() => {
          this.hoveredNodeTooltip = { title, path, tree, left, top };
        });
      },
      nodes: nodes || [],
      links: links || [],
      mapEntries: this.struct.d3Data?.mapEntries || [],
      simulation: simulation,
      svg: this.svg,
      width: width,
      height: height
    };

    // Trigger immediate render of elements
    this.globalRenderer.renderElements([this.struct]);
  }

  private resizeVisualizer(): void {
    if (!this.struct) return;
    const bounds = this.graphContainer.nativeElement.getBoundingClientRect();
    const width = bounds.width;
    const height = bounds.height;
    if (width <= 0 || height <= 0) return;
    const isGraph = this.struct.viewMode === 'graph';
    if (!this.svg || !this.struct.d3Data || (isGraph && !this.struct.d3Data.simulation)) {
      this.renderizeSvg();
      return;
    }
    if (width === this.renderedWidth && height === this.renderedHeight) return;

    this.renderedWidth = width;
    this.renderedHeight = height;
    this.svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'none');
    this.struct.d3Data.width = width;
    this.struct.d3Data.height = height;
    this.globalRenderer.renderElements([this.struct]);
  }

  closeSelectedValue(): void {
    if (this.struct.d3Data) {
      this.struct.d3Data.selectedValuePath = undefined;
      this.struct.d3Data.selectedValueSnapshot = undefined;
      this.struct.d3Data.onStructuredValueSelected?.(null);
    }
    this.globalRenderer.renderElements([this.struct]);
  }

  private updateSelectedValue(selection: StructuredValueSelection | null): void {
    if (!selection) {
      this.selectedValueTree = null;
      return;
    }

    this.selectedValueTree = projectJsonValueTree(
      selection.path,
      selection.path,
      selection.value,
      selection.previousValue,
      selection.hasPrevious
    );
  }

  private destroy() {
    this.hoveredNodeTooltip = null;
    this.struct?.d3Data?.simulation?.stop();
    d3.select(this.graphContainer.nativeElement).selectAll('*').remove();
    this.svg = null;
    this.renderedWidth = 0;
    this.renderedHeight = 0;
  }

}
