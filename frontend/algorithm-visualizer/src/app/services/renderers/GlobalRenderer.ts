import { Injectable } from "@angular/core";
import { Renderer } from "./Renderer";
import { ArrayRenderer } from "./ArrayRenderer";
import { GraphRenderer } from "./GraphRenderer";
import { StructureWindow } from "src/app/models/StructureWindow";

@Injectable({ providedIn: 'root' })
export class GlobalRenderer implements Renderer {

    constructor(private arrayRenderer: ArrayRenderer, private graphRenderer: GraphRenderer) { }

    renderElements(
        structures: StructureWindow[]
    ) {
        structures.forEach((structure: StructureWindow) => {
            if (structure.d3Data && structure.d3Data.svg) {
                this.graphRenderer.renderElements(structure.d3Data);
                this.arrayRenderer.renderElements(structure.d3Data);
            }
        });
    }
}