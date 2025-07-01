import { AfterViewInit, Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatInputModule } from '@angular/material/input';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GraphStrategy } from 'src/app/models/GraphStrategy/GraphStrategy';
import { GraphStrategyFactory } from 'src/app/models/GraphStrategy/GraphStrategyFactory';
import { GraphStructure } from 'src/app/models/GraphStructure';
import { ActivatedRoute, Router } from '@angular/router';
import { SwalService } from 'src/app/services/utils/swal/swal.service';
import { GraphItem } from 'src/app/models/GraphItem';
import { MatIconModule } from '@angular/material/icon';
import { GeminiService } from 'src/app/services/gemini.service';


@Component({
  selector: 'app-create-graph-structure',
  imports: [FormsModule, MatButtonModule, MatInputModule, MatButtonToggleModule, FormsModule, ReactiveFormsModule, FormsModule, MatIconModule],
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

  aiPrompt: string = '';

  constructor(private graphStrategyFactory: GraphStrategyFactory, private swalService: SwalService, private route: ActivatedRoute,
    private geminiService: GeminiService, private router:Router
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
          this.router.navigate([`/see-graph-structure/${graphId}`]);
        }, 1500);

      },
      error: () => {
        this.swalService.errorNoButton("Internal error while creating graph", "");
      }
    });
  }

  onCreateAI(items: GraphItem[], directed: boolean = false, weighted: boolean = false) {

    const graph: GraphStructure = {
      items: items,
      directed: directed,
      weighted: weighted
    }

    this.graphStrategy.createGraph(graph).subscribe({
      next: (graphIdDTO) => {

        const graphId = graphIdDTO.id;

        this.swalService.successNoButton("AI Graph created successfully", "");

        setTimeout(() => {
          this.router.navigate([`/see-graph-structure/${graphId}`]);
        }, 1500);

      },
      error: () => {
        this.swalService.errorNoButton("Internal error while creating graph with AI", "");
      }
    });
  }

  onClickAI() {
    if (!this.aiPrompt || this.aiPrompt.trim().length === 0) {
      this.swalService.warningNoButton(
        "Missing prompt",
        "Please enter a description before generating with AI."
      );
      return;
    }

    const directed: boolean = this.graphTypeControl.value || false;
    const weighted: boolean = this.graphWeightTypeControl.value || false;

    let prompt =
      "Gere a descrição de um grafo baseado no texto do usuário. " +
      "O usuário deve escrever algo relacionado à criação de um grafo. " +
      "Caso contrário, retorne um erro indicando que a descrição não é válida para um grafo.\n\n";

    prompt += `O grafo deve ser ${directed ? "direcionado" : "não direcionado"} ` +
      `e ${weighted ? "com peso" : "sem peso"}.\n\n`;

    if (!weighted) {
      prompt +=
        "O grafo deve ser representado apenas por números inteiros separados por espaço, " +
        "sem quaisquer outros caracteres. Cada linha representa uma aresta no formato:\n" +
        "origem destino\n" +
        "Por exemplo:\n" +
        "1 2\n3 4\n5 6\n" +
        "Indica que existe uma aresta de 1 para 2 (se direcionado, só nesse sentido; " +
        "se não direcionado, a aresta é bidirecional).\n\n";
    } else {
      prompt +=
        "O grafo deve ser representado apenas por números inteiros separados por espaço, " +
        "sem quaisquer outros caracteres. Cada linha representa uma aresta no formato:\n" +
        "origem destino peso\n" +
        "Por exemplo:\n" +
        "1 2 3\n4 5 6\n7 8 9\n" +
        "Indica que existe uma aresta de 1 para 2 (e de 2 para 1 se não direcionado) com peso 3.\n\n";
    }

    prompt +=
      "Se a descrição do usuário não for válida para gerar um grafo, responda SOMENTE no seguinte formato:\n" +
      "Error: <mensagem explicativa curta>\n\n" +
      "Não escreva mais nada além disso. Caso contrário, responda apenas os dados das arestas no formato especificado.\n\n";

      prompt +=
      "O grafo gerado deve ter no máximo 50 nós e no máximo 50 arestas.\n\n";

    prompt += `Descrição do usuário: "${this.aiPrompt.trim()}"\n\n`;

    prompt +=
      "Se o usuário não fornecer explicitamente o número de nós ou arestas na descrição, " +
      "por favor, utilize como padrão um grafo com cerca de 10 a 15 nós e 10 a 15 arestas.\n\n" +

      "Se o usuário pedir um tipo específico de grafo (como bipartido, árvore, completo, ciclo, etc.), " +
      "gere esse tipo corretamente, mas **respeitando o formato de saída exigido**.\n" +
      "Ou seja, a saída ainda deve conter **apenas números inteiros separados por espaço**, " +
      "uma aresta por linha, no formato:\n" +
      (weighted
        ? "origem destino peso\n"
        : "origem destino\n") +
      "sem quaisquer outros caracteres, nomes de conjuntos, colchetes, textos explicativos ou quebras de padrão.\n\n" +

      "A resposta deve conter **somente os dados das arestas** no formato especificado, sem títulos, legendas ou explicações.";


    this.geminiService.callGeminiApi(prompt).subscribe({
      next: (result: string) => {
        try {

          if (result.trim().startsWith("Error:")) {
            const errorMsg = result.trim().substring("Error:".length).trim() || "Unknown error from AI.";
            throw new Error(errorMsg);
          }

          const lines = result.trim().split('\n');

          const newItems: GraphItem[] = [];

          for (const line of lines) {
            const parts = line.trim().split(/\s+/); // separa por espaços ou tabs

            if (
              (!weighted && parts.length !== 2) ||
              (weighted && parts.length !== 3)
            ) {
              throw new Error("Unknown error from AI.");
            }

            if (parts.some(p => isNaN(Number(p)))) {
              throw new Error("Unknown error from AI.");
            }

            newItems.push({
              id: CreateGraphStructureComponent.incrementAndGetItemId(),
              text: line.trim()
            });
          }

          this.onCreateAI(newItems, directed, weighted);

        } catch (error: any) {
          this.swalService.errorNoButton(
            "",
            error.message || ""
          );
        }
      },
      error: () => {
        this.swalService.errorNoButton("Internal error while calling Gemini API", "");
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
          this.router.navigate([`/see-graph-structure/${graphId}`]);
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
