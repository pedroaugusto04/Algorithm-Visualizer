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
            const data = structure.d3Data;
            if (!data?.svg) return;

            if (structure.type === 'array') this.arrayRenderer.renderElements(data);
            else if (structure.type === 'map') this.graphRenderer.renderElements(data);
        });
    }
}
