import { CommonModule } from '@angular/common';
import { Component, forwardRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { JsonValueTreeNode } from '../../services/renderers/json-value-tree';

@Component({
  selector: 'app-json-value-tree',
  standalone: true,
  imports: [CommonModule, forwardRef(() => JsonValueTreeComponent)],
  templateUrl: './json-value-tree.component.html',
  styleUrls: ['./json-value-tree.component.scss']
})
export class JsonValueTreeComponent implements OnChanges {
  @Input({ required: true }) node!: JsonValueTreeNode;

  expanded = false;
  private currentPath = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['node'] || this.currentPath === this.node.path) return;
    this.currentPath = this.node.path;
    this.expanded = this.node.depth < 2;
  }

  updateExpandedState(event: Event): void {
    this.expanded = (event.currentTarget as HTMLDetailsElement).open;
  }
}
