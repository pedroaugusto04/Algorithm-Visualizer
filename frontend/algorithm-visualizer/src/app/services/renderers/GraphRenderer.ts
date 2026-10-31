import { Injectable } from "@angular/core";
import { Renderer } from "./Renderer";
import * as d3 from "d3";
import { isStructuredValue, refreshStructuredSelection, toggleStructuredSelection } from './structured-value-selection';

@Injectable({ providedIn: 'root' })
export class GraphRenderer implements Renderer {

    renderElements(
        d3Data: any
    ) {

        if (!d3Data || !d3Data.svg) {
            return;
        }

        const { width, height } = this.getDimensions(d3Data, d3Data.svg);
        const radius = 20;

        d3Data.svg
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'none');

        d3Data.svg.selectAll('g.array-cell, text.array-end-marker, g.map-header, g.map-entry').remove();

        if (!d3Data.simulation) {
            d3Data.simulation = d3.forceSimulation(d3Data.nodes)
                .force('link', d3.forceLink(d3Data.links).id((d: any) => d.id).distance(100))
                .force('charge', d3.forceManyBody().strength(-300))
                .force('center', d3.forceCenter(width / 2, height / 2))
                .force('collide', d3.forceCollide(radius + 5));
        }

        this.ensureArrowMarker(d3Data.svg);

        const link = d3Data.svg.selectAll('.link-item')
            .data(d3Data.links, (d: any) => `${d.source.id || d.source}-${d.target.id || d.target}`);

        link.exit().remove();

        const node = d3Data.svg.selectAll('.node-item')
            .data(d3Data.nodes, (d: any) => d.id);

        node.exit().remove();

        let linkGroup = d3Data.svg.select('g.links-group');
        if (linkGroup.empty()) {
            linkGroup = d3Data.svg.insert('g', ':first-child').attr('class', 'links-group');
        }

        let nodeGroup = d3Data.svg.select('g.nodes-group');
        if (nodeGroup.empty()) {
            nodeGroup = d3Data.svg.append('g').attr('class', 'nodes-group');
        }

        linkGroup.selectAll('line').remove();
        const linkKey = (d: any) => `${d.source?.id ?? d.source}->${d.target?.id ?? d.target}`;
        const linkSelection = linkGroup
            .selectAll('path.edge-path')
            .data(d3Data.links, linkKey)
            .join('path')
            .attr('class', 'edge-path')
            .attr('fill', 'none')
            .attr('stroke', '#999')
            .attr('stroke-width', 2)
            .attr('marker-end', 'url(#arrowhead)');

        const linkLabels = linkGroup.selectAll('text.edge-label')
            .data(d3Data.links, linkKey)
            .join('text')
            .attr('class', 'edge-label')
            .attr('text-anchor', 'middle')
            .attr('fill', '#334155')
            .style('font-size', '11px')
            .style('pointer-events', 'none')
            .text((d: any) => d.label ?? '');

        const nodeSelection = nodeGroup
            .selectAll('g.node-item')
            .data(d3Data.nodes, (d: any) => d.id)
            .join((enter: any) => {
                const g = enter.append('g')
                    .attr('class', 'node-item')
                    .style('cursor', 'pointer')
                    .call(this.drag(d3Data.simulation));


                g.append('circle')
                    .attr('r', radius)
                    .attr('stroke', '#fff')
                    .attr('stroke-width', 1.5);

                g.append('text')
                    .attr('class', 'node-text')
                    .text((d: any) => this.nodeLabel(d))
                    .attr('text-anchor', 'middle')
                    .attr('dy', '.35em')
                    .attr('fill', '#fff')
                    .style('font-family', 'sans-serif')
                    .style('font-size', '14px')
                    .style('pointer-events', 'none')
                    .style('user-select', 'none');

                return g;
            });

        refreshStructuredSelection(d3Data, d3Data.nodes
            .filter((node: any) => node.structuredValuePath)
            .map((node: any) => ({ path: node.structuredValuePath, value: node.structuredValue })));

        nodeSelection
            .style('cursor', (d: any) => isStructuredValue(d.structuredValue) ? 'pointer' : 'grab')
            .on('mouseenter.node-tooltip', (event: MouseEvent, d: any) => {
                d3Data.onNodeHover?.(d, event);
            })
            .on('mouseleave.node-tooltip', () => d3Data.onNodeHover?.(null, null))
            .on('click.structured-value', (_event: unknown, d: any) => {
                if (!isStructuredValue(d.structuredValue)) return;
                toggleStructuredSelection(d3Data, { path: d.structuredValuePath, value: d.structuredValue });
                nodeSelection.select('circle')
                    .attr('stroke', (node: any) => node.structuredValuePath === d3Data.selectedValuePath ? '#ff9800' : '#fff')
                    .attr('stroke-width', (node: any) => node.structuredValuePath === d3Data.selectedValuePath ? 3 : 1.5);
            });


        // sincroniza valor
        nodeSelection.select('text.node-text').text((d: any) => this.nodeLabel(d));

        const changed = d3Data.changedPaths as Set<string> | undefined;
        const isChangedNode = (d: any) =>
            (d.structuredValuePath && changed?.has(d.structuredValuePath)) ||
            (d.id && changed?.has(`${d3Data.ownerPath}[${d.id}]`));

        // sincroniza cor
        nodeSelection.select('circle')
            .attr('fill', (d: any) => isChangedNode(d) ? '#f59e0b' : (d.color || 'steelblue'))
            .attr('stroke', (d: any) => {
                if (d.structuredValuePath === d3Data.selectedValuePath) return '#ff9800';
                if (isChangedNode(d)) return '#ca8a04';
                return '#fff';
            })
            .attr('stroke-width', (d: any) => {
                if (d.structuredValuePath === d3Data.selectedValuePath || isChangedNode(d)) return 3;
                return 1.5;
            });

        // Preserve coordinates of previously simulated nodes to prevent jumpiness
        const prevNodes = d3Data.simulation.nodes() as any[] | undefined;
        let isTopologyChanged = true;
        if (prevNodes && prevNodes.length > 0) {
            const prevMap = new Map<string, any>(prevNodes.map((n: any) => [String(n.id), n]));
            isTopologyChanged = prevNodes.length !== d3Data.nodes.length;
            for (const n of d3Data.nodes) {
                const prev = prevMap.get(String(n.id));
                if (prev && prev.x !== undefined && prev.y !== undefined) {
                    n.x = prev.x;
                    n.y = prev.y;
                    n.vx = prev.vx;
                    n.vy = prev.vy;
                } else {
                    isTopologyChanged = true;
                }
            }
        }

        const edgeSet = new Set<string>();
        for (const l of d3Data.links) {
            const s = l.source?.id ?? l.source;
            const t = l.target?.id ?? l.target;
            edgeSet.add(`${s}->${t}`);
        }

        d3Data.simulation.nodes(d3Data.nodes);
        if (d3Data.simulation.force('link')) {
            d3Data.simulation.force('link').links(d3Data.links);
        } else {
            d3Data.simulation.force('link', d3.forceLink(d3Data.links).id((d: any) => d.id).distance(100));
        }
        d3Data.simulation.force('center', d3.forceCenter(width / 2, height / 2));
        d3Data.simulation.force('collide', d3.forceCollide(radius + 5));

        const updatePositions = () => {
            nodeSelection.attr('transform', (d: any) => {
                const x = d.x || width / 2;
                const y = d.y || height / 2;
                d.x = Math.max(radius, Math.min(width - radius, x));
                d.y = Math.max(radius, Math.min(height - radius, y));
                return `translate(${d.x},${d.y})`;
            });

            linkSelection.attr('d', (d: any) => {
                const sx = d.source?.x ?? 0;
                const sy = d.source?.y ?? 0;
                const tx = d.target?.x ?? 0;
                const ty = d.target?.y ?? 0;
                const sId = String(d.source?.id ?? d.source);
                const tId = String(d.target?.id ?? d.target);

                if (sId === tId) {
                    return `M ${sx},${sy - radius} C ${sx - 30},${sy - 50} ${sx + 30},${sy - 50} ${sx + 5},${sy - radius}`;
                }

                const hasReverse = edgeSet.has(`${tId}->${sId}`);
                if (!hasReverse) {
                    return `M ${sx},${sy} L ${tx},${ty}`;
                }

                const dx = tx - sx;
                const dy = ty - sy;
                const dr = Math.sqrt(dx * dx + dy * dy);
                if (dr === 0) return `M ${sx},${sy} L ${tx},${ty}`;

                const nx = -dy / dr;
                const ny = dx / dr;
                const curvature = 24;
                const cx = (sx + tx) / 2 + nx * curvature;
                const cy = (sy + ty) / 2 + ny * curvature;
                return `M ${sx},${sy} Q ${cx},${cy} ${tx},${ty}`;
            });

            linkLabels
                .attr('x', (d: any) => {
                    const sx = d.source?.x ?? 0;
                    const tx = d.target?.x ?? 0;
                    const sId = String(d.source?.id ?? d.source);
                    const tId = String(d.target?.id ?? d.target);
                    const hasReverse = sId !== tId && edgeSet.has(`${tId}->${sId}`);
                    if (!hasReverse) return (sx + tx) / 2;
                    const sy = d.source?.y ?? 0;
                    const ty = d.target?.y ?? 0;
                    const dx = tx - sx;
                    const dy = ty - sy;
                    const dr = Math.sqrt(dx * dx + dy * dy) || 1;
                    const nx = -dy / dr;
                    const cx = (sx + tx) / 2 + nx * 24;
                    return (sx + 2 * cx + tx) / 4;
                })
                .attr('y', (d: any) => {
                    const sy = d.source?.y ?? 0;
                    const ty = d.target?.y ?? 0;
                    const sId = String(d.source?.id ?? d.source);
                    const tId = String(d.target?.id ?? d.target);
                    const hasReverse = sId !== tId && edgeSet.has(`${tId}->${sId}`);
                    if (!hasReverse) return (sy + ty) / 2 - 6;
                    const sx = d.source?.x ?? 0;
                    const tx = d.target?.x ?? 0;
                    const dx = tx - sx;
                    const dy = ty - sy;
                    const dr = Math.sqrt(dx * dx + dy * dy) || 1;
                    const ny = dx / dr;
                    const cy = (sy + ty) / 2 + ny * 24;
                    return (sy + 2 * cy + ty) / 4 - 6;
                });
        };

        d3Data.simulation.on('tick', updatePositions);
        updatePositions();

        const alphaTarget = isTopologyChanged ? 0.3 : 0.05;
        d3Data.simulation.alpha(alphaTarget).restart();
    }

    private nodeLabel(node: any): string {
        return String(node?.label ?? node?.id ?? 'Node');
    }

    private getDimensions(d3Data: any, svg: any): { width: number, height: number } {
        const svgNode = svg?.node ? (svg.node() as SVGSVGElement) : null;
        let width = d3Data?.width;
        let height = d3Data?.height;

        if (!width || width <= 0) {
            width = svgNode?.clientWidth || 800;
        }
        if (!height || height <= 0) {
            height = svgNode?.clientHeight || 600;
        }

        return { width: width || 800, height: height || 600 };
    }

    private drag(simulation: any) {
        return d3.drag()
            .on('start', (event, d: any) => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on('drag', (event, d: any) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on('end', (event, d: any) => {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            });
    }

    private ensureArrowMarker(svg: any) {
        const defs = svg.select('defs').empty()
            ? svg.append('defs')
            : svg.select('defs');

        if (!defs.select('#arrowhead').empty()) return;

        defs.append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 28)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .attr('fill', '#000')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5');
    }
}
