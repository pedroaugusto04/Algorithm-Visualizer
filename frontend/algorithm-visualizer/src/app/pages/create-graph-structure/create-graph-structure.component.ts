import { AfterViewInit, Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatInputModule } from '@angular/material/input';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GraphStrategy } from 'src/app/models/GraphStrategy/GraphStrategy';
import { GraphStrategyFactory } from 'src/app/models/GraphStrategy/GraphStrategyFactory';
import { GraphStructure } from 'src/app/models/GraphStructure';
import { ActivatedRoute } from '@angular/router';
import { SwalService } from 'src/app/services/utils/swal/swal.service';
import { GraphItem } from 'src/app/models/GraphItem';


@Component({
  selector: 'app-create-graph-structure',
  imports: [FormsModule, MatButtonModule, MatInputModule, MatButtonToggleModule, FormsModule, ReactiveFormsModule, FormsModule],
  templateUrl: './create-graph-structure.component.html',
  styleUrl: './create-graph-structure.component.scss'
})
export class CreateGraphStructureComponent implements OnInit, AfterViewInit {

  @ViewChild('graphContainer', { static: true }) graphContainer!: ElementRef<HTMLDivElement>;
  @ViewChildren('graphInput') inputs!: QueryList<any>;

  svg: any;
  simulation: any;

  // options form control
  graphTypeControl = new FormControl(true);
  graphWeightTypeControl = new FormControl(false);

  // graph strategy (to renderize correct graph for options choosed)
  graphStrategy: GraphStrategy;

  items: GraphItem[];

  graphId: string | null;
  static itemId: number = 8; // comeca do 8 pra evitar repetir com os ids de items constantes

  constructor(private graphStrategyFactory: GraphStrategyFactory, private swalService: SwalService, private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      // caso exista, estamos editando ao inves de criar
      this.graphId = params.get('graphId');

      this.graphStrategyFactory.
        getGraphStrategy(this.graphTypeControl.value || false, this.graphWeightTypeControl.value || false, this.graphId).subscribe({
          next: (strategy: GraphStrategy) => {
            this.graphStrategy = strategy;
          }
        });
    });
  }


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

    this.route.paramMap.subscribe((params) => {

      this.graphId = params.get('graphId');

      this.graphStrategyFactory.
        getGraphStrategy(this.graphTypeControl.value || false, this.graphWeightTypeControl.value || false, this.graphId).subscribe({
          next: (strategy) => {

            this.graphStrategy = strategy;

            if (weightChanged || !this.items) {
              this.items = this.graphStrategy.getInitialItems();
            }

            this.graphStrategy.renderizeGraph(this.svg, this.items, this.graphContainer);
          }
        });
    })
  }

  onEnter(index: number) {
    if (index === this.items.length - 1) {
      this.items.push({ id: CreateGraphStructureComponent.incrementAndGetItemId(), text: '' });
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
    this.items = [{ id: CreateGraphStructureComponent.incrementAndGetItemId(), text: '' }];

    this.graphStrategy.renderizeGraph(this.svg, this.items, this.graphContainer);
  }

  getGraphPlaceholder(): string {
    return this.graphStrategy.getPlaceholder();
  }

  onClick() {
    if (!this.graphStrategy.validateGraphInput(this.items)) {
      this.swalService.warningNoButton("", "Invalid input for graph");
      return;
    }

    if (!this.items || this.items.length == 0) {
      this.swalService.warningNoButton("", "The created graph must have at least one node");
      return;
    }

    this.graphId ? this.onEdit() : this.onCreate();
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

        this.swalService.successNoButton("Graph created successfully", "");

        setTimeout(() => {
          window.location.href = `/see-graph-structure/${graphId}`;
        }, 1500);

      },
      error: () => {
        this.swalService.errorNoButton("Internal error while creating graph", "");
      }
    });
  }

  onEdit() {
    const graph: GraphStructure = {
      id: this.graphId,
      items: this.items,
      directed: this.graphTypeControl.value || false,
      weighted: this.graphWeightTypeControl.value || false
    }

    this.graphStrategy.updateGraph(graph).subscribe({
      next: (graphIdDTO) => {
        const graphId = graphIdDTO.id;

        this.swalService.successNoButton("Graph updated successfully", "");

        setTimeout(() => {
          window.location.href = `/see-graph-structure/${graphId}`;
        }, 1500);

      },
      error: () => {
        this.swalService.errorNoButton("Internal error while updating graph", "");
      }
    });
  }

  public static incrementAndGetItemId() {
    CreateGraphStructureComponent.itemId++;
    return CreateGraphStructureComponent.itemId;
  }
}
