import { Injectable } from "@angular/core";
import { Renderer } from "./Renderer";
import { ArrayRenderer } from "./ArrayRenderer";
import { GraphRenderer } from "./GraphRenderer";

@Injectable({ providedIn: 'root' })
export class GlobalRenderer implements Renderer {

    constructor(private arrayRenderer: ArrayRenderer, private graphRenderer: GraphRenderer) { }

    renderElements(
        d3Data: any
    ) {
        if (!d3Data || !d3Data.svg || !d3Data.simulation) {
            return;
        }

        this.graphRenderer.renderElements(d3Data);
        this.arrayRenderer.renderElements(d3Data);
    }
}