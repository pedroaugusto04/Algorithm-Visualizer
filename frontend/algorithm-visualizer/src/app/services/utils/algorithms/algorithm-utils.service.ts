import { Injectable } from '@angular/core';
import { StructureWindow } from 'src/app/models/StructureWindow';

@Injectable({
  providedIn: 'root'
})
export class AlgorithmUtilsService {

  getOrCreateStructure(structures: StructureWindow[], path: string, type: string): StructureWindow {

    const parts = path.split(/[\[\]]+/).filter(p => p !== "");
    if (parts.length === 0) return null as any;

    const rootName = parts[0];

    let current = structures.find(s => s.path === rootName);

    if (!current) {
      current = this.createNewNode(rootName, rootName, type);
      structures.push(current);
    }

    let accumulatedPath = rootName;
    for (let i = 1; i < parts.length; i++) {
      const partName = parts[i];
      accumulatedPath += `[${partName}]`;

      let child: any = current!.children.find(c => c.path === partName);

      if (!child) {
        child = this.createNewNode(partName, accumulatedPath, type);
        current!.children.push(child);
      }
      current = child;
    }

    if (!current) {
      throw new Error(`Não foi possível resolver ou criar a estrutura para o path: ${path}`);
    }

    return current;
  }

  private createNewNode(name: string, fullPath: string, type: string): StructureWindow {
    return {
      path: name,
      fullPath: fullPath,
      type: type,
      children: [],
      d3Data: {
        arrayData: [],
        nodes: [],
        links: [],
        simulation: null as any,
        svg: null,
        width: 0,
        height: 0
      }
    };
  }
}