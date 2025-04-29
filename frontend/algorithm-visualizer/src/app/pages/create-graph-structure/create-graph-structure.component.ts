import { Component, ElementRef, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import * as d3 from 'd3';
import { AnonymousSubject } from 'rxjs/internal/Subject';


@Component({
  selector: 'app-create-graph-structure',
  imports: [FormsModule, MatButtonModule, MatInputModule],
  templateUrl: './create-graph-structure.component.html',
  styleUrl: './create-graph-structure.component.scss'
})
export class CreateGraphStructureComponent {
  items = [
    { text: '1 4' },
    { text: '1 3' },
    { text: '3 2' },
    { text: '3 4' }
  ];

  @ViewChild('graphContainer', { static: true }) graphContainer!: ElementRef<HTMLDivElement>;
  @ViewChildren('graphInput') inputs!: QueryList<any>;

  svg: any;
  simulation: any;

  ngAfterViewInit() {
    this.renderizeGraph();
  }

  onEnter(index: number) {
    if (index === this.items.length - 1) {
      this.items.push({ text: '' });
      setTimeout(() => this.focusLastInput(), 0);
    } else {
      const inputsArray = this.inputs.toArray();
      if (inputsArray[index + 1]) {
        inputsArray[index + 1].nativeElement.focus();
      }
    }
  }

  onPaste(event: ClipboardEvent, index: number) {
    setTimeout(() => {
      const input = this.inputs.toArray()[index]?.nativeElement as HTMLInputElement;
      const value = input.value.trim();

      const parts = value.split(/\s+/);

      if (parts.length > 1) {
        const newItems = [];

        for (let i = 0; i < parts.length; i += 2) {
          const pair = [parts[i], parts[i + 1]].filter(Boolean).join(' ');
          if (pair) {
            newItems.push({ text: pair });
          }
        }

        this.items.splice(index, 1, ...newItems);

        setTimeout(() => this.focusLastInput(), 0);
      }
    }, 0);
  }

  onInput() {
    this.renderizeGraph();
  }

  private focusLastInput() {
    const inputsArray = this.inputs.toArray();
    if (inputsArray.length > 0) {
      inputsArray[inputsArray.length - 1].nativeElement.focus();
    }
  }

  onClear() {
    this.items = [{ text: '' }];
    this.renderizeGraph();
  }

  private renderizeGraph() {
    if (this.svg) {
      this.svg.remove(); 
    }

    const nodesSet = new Set<number>();
    const links: { source: number, target: number }[] = [];

    for (const item of this.items) {
      const parts = item.text.trim().split(/\s+/);
      if (parts.length === 2) {
        const source = Number(parts[0]);
        const target = Number(parts[1]);
        if (!isNaN(source) && !isNaN(target)) {
          links.push({ source, target });
          nodesSet.add(source);
          nodesSet.add(target);
        }
      }
    }

    const nodes: any[] = Array.from(nodesSet).map((d:any) => ({ id: d }));

    const containerRect = this.graphContainer.nativeElement.getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height;


    this.svg = d3.select(this.graphContainer.nativeElement)
      .append('svg')
      .attr('viewBox',`0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('width',width)
      .attr('height',height)

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = this.svg.append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', 2);

    const node = this.svg.append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', 20)
      .attr('fill', 'steelblue')
      .attr('cursor', 'pointer')
      .call(d3.drag()
      .on('start', (event: any, d: any) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event: any, d: any) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event: any, d: any) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }));

    const label = this.svg.append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .text((d: any) => d.id)
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('font-size', '14px')
      .attr('fill', '#fff');

      simulation.on('tick', () => {
        node
          .attr('cx', (d: any) => d.x = Math.max(20, Math.min(width - 20, d.x)))
          .attr('cy', (d: any) => d.y = Math.max(20, Math.min(height - 20, d.y)));
      
        link
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y);
      
        label
          .attr('x', (d: any) => d.x)
          .attr('y', (d: any) => d.y);
      });
  }
}
