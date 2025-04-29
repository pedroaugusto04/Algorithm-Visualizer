import { Component, ElementRef, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatInputModule } from '@angular/material/input';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GraphStrategy } from 'src/app/models/GraphStrategy/GraphStrategy';
import { GraphStrategyFactory } from 'src/app/models/GraphStrategy/GraphStrategyFactory';


@Component({
  selector: 'app-create-graph-structure',
  imports: [FormsModule, MatButtonModule, MatInputModule,MatButtonToggleModule,FormsModule,ReactiveFormsModule,FormsModule],
  templateUrl: './create-graph-structure.component.html',
  styleUrl: './create-graph-structure.component.scss'
})
export class CreateGraphStructureComponent {

  GRAPH_TYPE_DIRECTED = "0"
  GRAPH_TYPE_UNDIRECTED = "1"

  GRAPH_WEIGHT_TYPE_WEIGHTED = "0"
  GRAPH_WEIGHT_TYPE_UNWEIGHTED = "1"

  @ViewChild('graphContainer', { static: true }) graphContainer!: ElementRef<HTMLDivElement>;
  @ViewChildren('graphInput') inputs!: QueryList<any>;

  svg: any;
  simulation: any;

  // options form control
  graphTypeControl = new FormControl("1");
  graphWeightTypeControl = new FormControl("0");  

  // graph strategy (to renderize correct graph for options choosed)
  graphStrategy: GraphStrategy = GraphStrategyFactory.
  getGraphStrategy(this.graphTypeControl.value || "", this.graphWeightTypeControl.value || "");

  items = this.graphStrategy.getInitialItems();


  ngAfterViewInit() {
    this.updateStrategy();

    this.graphTypeControl.valueChanges.subscribe(() => {
      this.updateStrategy();
    });
  
    this.graphWeightTypeControl.valueChanges.subscribe(() => {
      this.updateStrategy(true);
    });
  }


  private updateStrategy(weightChanged: boolean = false) {
    this.graphStrategy = GraphStrategyFactory.getGraphStrategy(
      this.graphTypeControl.value || "",
      this.graphWeightTypeControl.value || ""
    );

    if (weightChanged) {
      this.items = this.graphStrategy.getInitialItems();
    }

    this.graphStrategy.renderizeGraph(this.svg,this.items,this.graphContainer);

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
    this.graphStrategy.onPaste(event,index,this.inputs,this.items, this.svg, this.graphContainer);
  }

  onInput() {
    this.graphStrategy.renderizeGraph(this.svg,this.items,this.graphContainer);
    console.log(this.items)
  }

  private focusLastInput() {
    const inputsArray = this.inputs.toArray();
    if (inputsArray.length > 0) {
      inputsArray[inputsArray.length - 1].nativeElement.focus();
    }
  }

  onClear() {
    this.items = [{text: ''}];

    this.graphStrategy.renderizeGraph(this.svg,this.items,this.graphContainer);
  }
  
  getGraphPlaceholder(): string {
    return this.graphStrategy.getPlaceholder();
  }

  onCreate() {
    this.graphStrategy.createGraph();
  }
}
