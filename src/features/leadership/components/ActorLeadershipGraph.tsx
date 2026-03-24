'use client';

import { useMemo, useState } from 'react';

import {
  Background,
  BackgroundVariant,
  type Edge,
  Handle,
  MarkerType,
  type Node,
  type NodeMouseHandler,
  type NodeProps,
  Position,
  ReactFlow,
  type ReactFlowInstance,
  ReactFlowProvider,
} from '@xyflow/react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';

import { getLeadershipHeaderColor, getLeadershipTierColor } from '@/features/leadership/lib/leadership-colors';
import { useActorLeadership } from '@/features/leadership/queries';

import { useIsMobile } from '@/shared/hooks/use-is-mobile';

import type { Actor, LeadershipNode, LeadershipTreeResponse } from '@/types/domain';

import '@xyflow/react/dist/style.css';

type Props = {
  actor: Actor;
  pageScroll?: boolean;
};

type GraphNodeData = {
  id: string;
  kind: 'active' | 'previous';
  hasSuccession?: boolean;
  successionIndex?: number;
  tier: number;
  title: string;
  name: string;
  query: string;
  wikipediaPageUrl?: string | null;
  wikipediaImageUrl?: string | null;
  status: 'ALIVE' | 'DEAD' | 'UNKNOWN' | 'VACANT';
  summary: string;
  dateLabel?: string;
  reportsTo?: string[];
};

type FlowGraph = {
  nodes: Node<GraphNodeData>[];
  edges: Edge[];
  height: number;
};

const STATUS_STYLE = {
  ALIVE: 'border-[var(--success-bd)] bg-[var(--success-dim)] text-[var(--success)]',
  DEAD: 'border-[var(--danger-bd)] bg-[var(--danger-dim)] text-[var(--danger)]',
  UNKNOWN: 'border-[var(--warning-bd)] bg-[var(--warning-dim)] text-[var(--warning)]',
  VACANT: 'border-[var(--bd)] bg-[var(--bg-3)] text-[var(--t3)]',
} as const;

function Portrait({ name, imageUrl }: { name: string; imageUrl?: string | null }) {
  const image = imageUrl ?? null;

  if (!image) {
    return <div className="flex h-full items-center justify-center text-lg font-bold text-[var(--t3)]">{name.slice(0, 1).toUpperCase()}</div>;
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={image} alt={name} className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />;
}

function LeadershipNode({ data }: NodeProps<Node<GraphNodeData>>) {
  const compact = data.kind === 'previous';
  const isFirstSuccession = compact && data.successionIndex === 0;
  const portraitSize = compact ? 'h-14 w-14' : 'h-24 w-24';

  return (
    <div className={`relative cursor-pointer rounded-sm border border-[var(--bd)] bg-[var(--bg-1)] shadow-[0_0_0_1px_rgba(255,255,255,0.02)] ${compact ? 'w-[240px]' : 'w-[300px]'}`}>
      <Handle id="in-top" type="target" position={Position.Top} className="!h-2 !w-2 !border-[var(--blue)] !bg-[var(--bg-app)]" />
      {isFirstSuccession && <Handle id="in-left" type="target" position={Position.Left} className="!h-2 !w-2 !border-[var(--t4)] !bg-[var(--bg-app)]" />}
      {compact && !isFirstSuccession && <Handle id="in-top-prev" type="target" position={Position.Top} className="!h-2 !w-2 !border-[var(--t4)] !bg-[var(--bg-app)]" />}

      <div className="h-[10px] w-full" style={{ background: getLeadershipHeaderColor(data.tier, data.status) }} />
      <div className="border-b border-[var(--bd)] bg-[linear-gradient(180deg,var(--bg-2),var(--bg-1))] px-3 py-2">
        <div className="label text-[length:var(--text-tiny)] text-[var(--t4)]">{data.title}</div>
        <div className="mt-2 flex items-start gap-3">
          <div className={`relative shrink-0 overflow-hidden border border-[var(--bd)] bg-[var(--bg-app)] ${portraitSize}`}>
            <Portrait name={data.name} imageUrl={data.wikipediaImageUrl} />
          </div>
          <div className="min-w-0 flex-1">
            <div className={`${compact ? 'text-[length:var(--text-body-sm)]' : 'text-[length:var(--text-body)]'} font-semibold leading-snug text-[var(--t1)]`}>{data.name}</div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className={`mono inline-flex border px-2 py-0.5 text-[length:var(--text-caption)] font-bold ${STATUS_STYLE[data.status]}`}>{data.status}</span>
              {data.dateLabel && <span className="mono text-[length:var(--text-caption)] text-[var(--t4)]">{data.dateLabel}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="px-3 py-3">
        <p className={`${compact ? 'text-[length:var(--text-label)]' : 'text-[length:var(--text-body-sm)]'} leading-relaxed text-[var(--t2)]`}>{data.summary}</p>
        {!compact && data.reportsTo && data.reportsTo.length > 0 && <div className="mt-2 mono text-[length:var(--text-label)] text-[var(--t4)]">Reports to {data.reportsTo.join(' / ')}</div>}
      </div>

      <Handle id="out-bottom" type="source" position={Position.Bottom} className="!h-2 !w-2 !border-[var(--blue)] !bg-[var(--bg-app)]" />
      {!compact && data.hasSuccession && <Handle id="out-right" type="source" position={Position.Right} className="!h-2 !w-2 !border-[var(--t4)] !bg-[var(--bg-app)]" />}
    </div>
  );
}

const nodeTypes = {
  leadership: LeadershipNode,
};

function buildGraph(tree: LeadershipTreeResponse): FlowGraph {
  const activeNodes = tree.nodes.filter(node => node.kind === 'active');
  const previousNodes = tree.nodes.filter(node => node.kind === 'previous');
  const allNodesById = new Map(tree.nodes.map(node => [node.id, node]));
  const titleToId = new Map(activeNodes.map(node => [node.title, node.id]));
  const orderIndex = new Map(activeNodes.map((node, index) => [node.id, index]));
  const levels = [...new Set(activeNodes.map(node => node.tier))].sort((a, b) => a - b);
  const nodes: Node<GraphNodeData>[] = [];
  const edges: Edge[] = [];
  const positions = new Map<string, { x: number; y: number }>();
  const columnGap = 64;
  const tierGap = 170;
  const activeNodeWidth = 300;
  const predecessorNodeWidth = 240;
  const predecessorColumnOffset = 360;
  const predecessorRowGap = 280;
  const activeNodeHeight = 260;
  const firstPredecessorOffsetY = 24;
  let currentY = 0;

  for (const level of levels) {
    const group = activeNodes
      .filter(node => node.tier === level)
      .sort((a, b) => {
        const aParentId = a.reportsTo[0] ? titleToId.get(a.reportsTo[0]) : undefined;
        const bParentId = b.reportsTo[0] ? titleToId.get(b.reportsTo[0]) : undefined;
        const aParentX = aParentId ? positions.get(aParentId)?.x ?? 0 : Number.NEGATIVE_INFINITY;
        const bParentX = bParentId ? positions.get(bParentId)?.x ?? 0 : Number.NEGATIVE_INFINITY;
        if (aParentX !== bParentX) return aParentX - bParentX;
        return (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0);
      });

    const maxSuccessionRows = Math.max(0, ...group.map(node => Math.max(previousNodes.filter(prev => prev.roleId === node.roleId).length - 1, 0)));
    const footprints = group.map(node => activeNodeWidth + (node.hasSuccession ? predecessorColumnOffset + predecessorNodeWidth - activeNodeWidth : 0));
    const totalWidth = footprints.reduce((sum, width) => sum + width, 0) + Math.max(group.length - 1, 0) * columnGap;
    let cursorX = -(totalWidth / 2);

    group.forEach((card, index) => {
      const x = cursorX;
      const y = currentY;
      positions.set(card.id, { x, y });

      nodes.push({
        id: card.id,
        type: 'leadership',
        position: { x, y },
        draggable: false,
        selectable: false,
        data: {
          id: card.id,
          kind: 'active',
          hasSuccession: card.hasSuccession,
          tier: card.tier,
          title: card.title,
          name: card.name,
          query: card.query,
          wikipediaPageUrl: card.wikipediaPageUrl,
          wikipediaImageUrl: card.wikipediaImageUrl,
          status: card.status,
          summary: card.summary,
          dateLabel: card.dateLabel,
          reportsTo: card.reportsTo,
        },
      });

      const chained = previousNodes.filter(prev => prev.roleId === card.roleId).sort((a, b) => (a.successionIndex ?? 0) - (b.successionIndex ?? 0));
      chained.forEach((prev, prevIndex) => {
        const prevId = prev.id;

        nodes.push({
          id: prevId,
          type: 'leadership',
          position: {
            x: x + predecessorColumnOffset,
            y: currentY + firstPredecessorOffsetY + prevIndex * predecessorRowGap,
          },
          draggable: false,
          selectable: false,
          data: {
            id: prevId,
            kind: 'previous',
            successionIndex: prevIndex,
            tier: card.tier,
            title: prev.title,
            name: prev.name,
            query: prev.query,
            wikipediaPageUrl: prev.wikipediaPageUrl,
            wikipediaImageUrl: prev.wikipediaImageUrl,
            status: prev.status,
            summary: prev.summary,
            dateLabel: prev.dateLabel,
          },
        });
      });

      cursorX += footprints[index] + columnGap;
    });

    currentY += activeNodeHeight + maxSuccessionRows * predecessorRowGap + tierGap;
  }

  for (const relation of tree.edges) {
    const targetNode = allNodesById.get(relation.target);
    const isFirstSuccession = relation.kind === 'succession' && targetNode?.kind === 'previous' && targetNode.successionIndex === 0;
    edges.push({
      id: relation.id,
      source: relation.source,
      target: relation.target,
      type: 'smoothstep',
      animated: false,
      selectable: false,
      sourceHandle: relation.kind === 'succession'
        ? isFirstSuccession
          ? 'out-right'
          : 'out-bottom'
        : 'out-bottom',
      targetHandle: relation.kind === 'succession'
        ? isFirstSuccession
          ? 'in-left'
          : 'in-top-prev'
        : 'in-top',
      markerEnd: { type: MarkerType.ArrowClosed, color: getLeadershipTierColor(relation.tier) },
      style: relation.kind === 'succession'
        ? { stroke: getLeadershipTierColor(relation.tier), strokeWidth: 2.5, strokeDasharray: '8 5', opacity: 0.96 }
        : { stroke: getLeadershipTierColor(relation.tier), strokeWidth: 3, opacity: 0.98 },
    });
  }

  return { nodes, edges, height: currentY + 120 };
}

function getLeadershipTitle(actorName?: string): string {
  if (!actorName) return 'Leadership Tree';
  return `${actorName} Leadership Tree`;
}

type LeadershipDetailProps = {
  selectedNode: GraphNodeData;
  headerCollapsed: boolean;
  onHeaderCollapsedChange: (collapsed: boolean) => void;
  mobile?: boolean;
};

function LeadershipDetailPanel({ selectedNode, headerCollapsed, onHeaderCollapsedChange, mobile = false }: LeadershipDetailProps) {
  const bodyHeight = headerCollapsed
    ? mobile
      ? 'h-[calc(100dvh-78px)]'
      : 'h-[calc(94vh-88px)]'
    : mobile
      ? 'h-[calc(100dvh-200px)]'
      : 'h-[calc(94vh-190px)]';

  return (
    <>
      {headerCollapsed ? (
        <div className={`flex items-center justify-between gap-3 border-b border-[var(--bd)] bg-[var(--bg-1)] py-3 pr-12 ${mobile ? 'safe-px' : 'px-4 md:px-5'}`}>
          <div className="min-w-0 flex-1">
            <div className="mb-2 h-[10px] w-full" style={{ background: getLeadershipHeaderColor(selectedNode.tier, selectedNode.status) }} />
            <div className="flex flex-wrap items-center gap-2">
              <DialogTitle className="text-[length:var(--text-subhead)] leading-tight text-[var(--t1)] md:text-[16px]">{selectedNode.name}</DialogTitle>
              <span className={`mono inline-flex border px-2 py-0.5 text-[length:var(--text-caption)] font-bold ${STATUS_STYLE[selectedNode.status]}`}>{selectedNode.status}</span>
            </div>
          </div>
          <Button variant="outline" size="sm" className="h-8 border-[var(--bd)] bg-[var(--bg-2)] text-[var(--t2)] hover:bg-[var(--bg-3)]" onClick={() => onHeaderCollapsedChange(false)}>
            Expand
          </Button>
        </div>
      ) : (
        <DialogHeader
          className={`border-b border-[var(--bd)] bg-[var(--bg-1)] pr-12 ${mobile ? 'safe-px py-4' : 'p-4 md:p-5 md:pr-12'}`}
          style={mobile ? { paddingTop: 'max(16px, env(safe-area-inset-top))' } : undefined}
        >
          <div className="mb-3 h-[10px] w-full" style={{ background: getLeadershipHeaderColor(selectedNode.tier, selectedNode.status) }} />
          <div className="flex items-start gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden border border-[var(--bd)] bg-[var(--bg-2)] md:h-28 md:w-28">
              {selectedNode.wikipediaImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedNode.wikipediaImageUrl} alt={selectedNode.name} className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
              ) : (
                <div className="flex h-full items-center justify-center text-2xl font-bold text-[var(--t3)]">{selectedNode.name.slice(0, 1).toUpperCase()}</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="label mb-1 text-[length:var(--text-tiny)] text-[var(--t4)]">{selectedNode.title}</div>
              <DialogTitle className="text-[17px] leading-tight text-[var(--t1)] md:text-[18px]">{selectedNode.name}</DialogTitle>
              <DialogDescription className="mt-2 flex flex-wrap items-center gap-2 text-[var(--t3)]">
                <span className={`mono inline-flex border px-2 py-0.5 text-[length:var(--text-caption)] font-bold ${STATUS_STYLE[selectedNode.status]}`}>{selectedNode.status}</span>
                {selectedNode.dateLabel && <span className="mono text-[length:var(--text-label)] text-[var(--t4)]">{selectedNode.dateLabel}</span>}
                <span className="mono text-[length:var(--text-label)] text-[var(--t4)]">Tier {selectedNode.tier + 1}</span>
              </DialogDescription>
              <p className="mt-3 text-[length:var(--text-body)] leading-relaxed text-[var(--t2)]">{selectedNode.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedNode.wikipediaPageUrl && (
                  <Button asChild variant="outline" size="sm" className="h-8 border-[var(--bd)] bg-[var(--bg-2)] text-[var(--t2)] hover:bg-[var(--bg-3)]">
                    <a href={selectedNode.wikipediaPageUrl} target="_blank" rel="noreferrer">Open full Wikipedia</a>
                  </Button>
                )}
                <Button variant="outline" size="sm" className="h-8 border-[var(--bd)] bg-[var(--bg-2)] text-[var(--t2)] hover:bg-[var(--bg-3)]" onClick={() => onHeaderCollapsedChange(true)}>
                  Collapse header
                </Button>
              </div>
            </div>
          </div>
        </DialogHeader>
      )}

      <ScrollArea className={bodyHeight}>
        <div className="px-4 py-4 md:px-5 md:py-5">
          <div className="mb-4 flex items-center justify-between border-b border-[var(--bd-s)] pb-2">
            <div className="section-title text-[length:var(--text-label)]">Wikipedia dossier</div>
          </div>

          {selectedNode.wikipediaPageUrl ? (
            <div className="overflow-hidden rounded-sm border border-[var(--bd)] bg-white">
              <iframe
                key={selectedNode.wikipediaPageUrl}
                src={selectedNode.wikipediaPageUrl}
                title={selectedNode.name}
                className={`w-full ${mobile ? 'h-[72dvh]' : 'h-[76vh]'}`}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[length:var(--text-body)] leading-relaxed text-[var(--t3)]">No stored Wikipedia article is available for this node yet.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  );
}

function LeadershipBoardWithActor({ actor }: { actor: Props['actor'] }) {
  const { data: tree, isLoading } = useActorLeadership(undefined, actor.id);
  const [selectedNode, setSelectedNode] = useState<GraphNodeData | null>(null);
  const [headerCollapsed, setHeaderCollapsed] = useState(true);
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance<Node<GraphNodeData>, Edge> | null>(null);
  const isMobile = useIsMobile(1024);
  const graph = useMemo(() => (tree ? buildGraph(tree) : { nodes: [], edges: [], height: 980 }), [tree]);
  const boardHeight = Math.max(
    Math.min(graph.height, isMobile ? 680 : 760),
    isMobile ? 520 : 620,
  );

  const onNodeClick: NodeMouseHandler<Node<GraphNodeData>> = (_, node) => {
    setHeaderCollapsed(true);
    setSelectedNode(node.data);
  };

  const resetView = () => {
    flowInstance?.fitView({
      padding: isMobile ? 0.18 : 0.14,
      duration: 250,
      minZoom: isMobile ? 0.72 : 0.45,
      maxZoom: isMobile ? 1.45 : 1.1,
    });
  };

  return (
    <>
      <div className="px-4 py-4 md:px-5">
        <div className="mb-4 flex items-end justify-between gap-3 border-b border-[var(--bd)] pb-3">
          <div>
            <div className="label mb-1 text-[length:var(--text-tiny)]">WARTIME SUCCESSION / COMMAND GRAPH</div>
            <h2 className="section-title text-[length:var(--text-body)]">{getLeadershipTitle(tree?.actorName ?? actor.name)}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 border-[var(--bd)] bg-[var(--bg-2)] text-[var(--t2)] hover:bg-[var(--bg-3)]" onClick={resetView}>
              Reset view
            </Button>
            <div className="mono text-[length:var(--text-label)] text-[var(--t4)]">{isMobile ? 'Tap a node for full profile' : 'Click a node for full profile'}</div>
          </div>
        </div>

        <div className="rounded-sm border border-[var(--bd)] bg-[linear-gradient(180deg,var(--bg-1),var(--bg-app))]">
          <div className="w-full" style={{ height: `${boardHeight}px` }}>
            <ReactFlow
              fitView
              fitViewOptions={{ padding: isMobile ? 0.18 : 0.14, minZoom: isMobile ? 0.72 : 0.45, maxZoom: isMobile ? 1.45 : 1.1 }}
              nodes={graph.nodes}
              edges={graph.edges}
              nodeTypes={nodeTypes}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              onNodeClick={onNodeClick}
              onInit={setFlowInstance}
              panOnDrag
              panOnScroll={false}
              zoomOnScroll={!isMobile}
              zoomOnPinch
              zoomOnDoubleClick={false}
              minZoom={isMobile ? 0.14 : 0.45}
              maxZoom={2.25}
              proOptions={{ hideAttribution: true }}
              defaultEdgeOptions={{ type: 'smoothstep' }}
            >
              <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="rgba(120,138,168,0.2)" />
            </ReactFlow>
            {isLoading && <div className="pointer-events-none absolute inset-0 flex items-center justify-center mono text-[length:var(--text-body)] text-[var(--t4)]">Loading leadership tree...</div>}
          </div>
        </div>
      </div>

      {isMobile ? (
        <Sheet open={Boolean(selectedNode)} onOpenChange={(open) => { if (!open) { setSelectedNode(null); setHeaderCollapsed(true); } }}>
          <SheetContent side="bottom" showCloseButton className="h-[100dvh] max-h-[100dvh] gap-0 overflow-hidden border-[var(--bd)] bg-[var(--bg-app)] p-0">
            {selectedNode && (
              <>
                <SheetHeader className="sr-only">
                  <SheetTitle>{selectedNode.name}</SheetTitle>
                  <SheetDescription>{selectedNode.title}</SheetDescription>
                </SheetHeader>
                <LeadershipDetailPanel selectedNode={selectedNode} headerCollapsed={headerCollapsed} onHeaderCollapsedChange={setHeaderCollapsed} mobile />
              </>
            )}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={Boolean(selectedNode)} onOpenChange={(open) => { if (!open) { setSelectedNode(null); setHeaderCollapsed(true); } }}>
          <DialogContent className="h-[94vh] !w-[96vw] !max-w-[96vw] overflow-hidden border-[var(--bd)] bg-[var(--bg-app)] p-0">
            {selectedNode && <LeadershipDetailPanel selectedNode={selectedNode} headerCollapsed={headerCollapsed} onHeaderCollapsedChange={setHeaderCollapsed} />}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export function ActorLeadershipGraph({ actor, pageScroll = false }: Props) {
  return (
    <ReactFlowProvider>
      <div className={pageScroll ? '' : 'h-full'}>
        <LeadershipBoardWithActor actor={actor} />
      </div>
    </ReactFlowProvider>
  );
}
