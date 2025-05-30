import { Component, ElementRef, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatInputModule } from '@angular/material/input';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GraphStrategy } from 'src/app/models/GraphStrategy/GraphStrategy';
import { GraphStrategyFactory } from 'src/app/models/GraphStrategy/GraphStrategyFactory';
import { GraphStructure } from 'src/app/models/GraphStructure';
import { Router } from '@angular/router';
import { SwalService } from 'src/app/services/utils/swal/swal.service';


@Component({
  selector: 'app-create-graph-structure',
  imports: [FormsModule, MatButtonModule, MatInputModule, MatButtonToggleModule, FormsModule, ReactiveFormsModule, FormsModule],
  templateUrl: './create-graph-structure.component.html',
  styleUrl: './create-graph-structure.component.scss'
})
export class CreateGraphStructureComponent {

  @ViewChild('graphContainer', { static: true }) graphContainer!: ElementRef<HTMLDivElement>;
  @ViewChildren('graphInput') inputs!: QueryList<any>;

  svg: any;
  simulation: any;

  // options form control
  graphTypeControl = new FormControl(true);
  graphWeightTypeControl = new FormControl(false);

  // graph strategy (to renderize correct graph for options choosed)
  graphStrategy: GraphStrategy = this.graphStrategyFactory.
    getGraphStrategy(this.graphTypeControl.value || false, this.graphWeightTypeControl.value || false);

  items = this.graphStrategy.getInitialItems();

  constructor(private graphStrategyFactory: GraphStrategyFactory, private swalService: SwalService,
    private router: Router
  ) { }


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

    this.graphStrategy = this.graphStrategyFactory.
      getGraphStrategy(this.graphTypeControl.value || false, this.graphWeightTypeControl.value || false);


    if (weightChanged) {
      this.items = this.graphStrategy.getInitialItems();
    }

    this.graphStrategy.renderizeGraph(this.svg, this.items, this.graphContainer);

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
    this.graphStrategy.onPaste(event, index, this.inputs, this.items, this.svg, this.graphContainer);
  }

  onInput() {
    this.graphStrategy.renderizeGraph(this.svg, this.items, this.graphContainer);
  }

  private focusLastInput() {
    const inputsArray = this.inputs.toArray();
    if (inputsArray.length > 0) {
      inputsArray[inputsArray.length - 1].nativeElement.focus();
    }
  }

  onClear() {
    this.items = [{ text: '' }];

    this.graphStrategy.renderizeGraph(this.svg, this.items, this.graphContainer);
  }

  getGraphPlaceholder(): string {
    return this.graphStrategy.getPlaceholder();
  }

  onCreate() {
    const graph: GraphStructure = {

      items: this.items,
      directed: this.graphTypeControl.value || false,
      weighted: this.graphWeightTypeControl.value || false
    }

    this.graphStrategy.createGraph(graph).subscribe({
      next: (graphIdDTO) => {

        const graphId = graphIdDTO.id;

        this.swalService.successNoButton("Graph created successfully","");

        setTimeout(() => {
          window.location.href = `/see-graph-structure/${graphId}`;
        }, 1500);

      },
      error: () => {
        this.swalService.errorNoButton("Internal error while creating graph","");
      }
    });
  }
}
