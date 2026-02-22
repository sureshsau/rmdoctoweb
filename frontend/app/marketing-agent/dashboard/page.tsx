"use client";

import React, { useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Handle,
  MiniMap,
  MarkerType,
  Position,
  type Edge,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";
import { Search, ShieldCheck, Phone, Crown, Sparkles, Users, Network } from "lucide-react";

import { useAuthContext } from "@/state/AuthContext";
import { marketingAgentService, type MarketingAgentNode } from "@/services/marketingAgent.service";

type AgentNodeData = {
  name: string;
  phone: string;
  level: number;
  isRoot?: boolean;
};

const NODE_WIDTH = 220;
const NODE_HEIGHT = 88;
const H_GAP = 40;
const V_GAP = 120;

const filterTree = (node: MarketingAgentNode, query: string): MarketingAgentNode | null => {
  const isMatch = node.name.toLowerCase().includes(query) || node.phone.toLowerCase().includes(query);
  const children = (node.children || [])
    .map((child) => filterTree(child, query))
    .filter((child): child is MarketingAgentNode => Boolean(child));

  if (isMatch || children.length > 0) {
    return { ...node, children };
  }

  return null;
};

const buildGraph = (roots: MarketingAgentNode[]) => {
  const nodes: Node<AgentNodeData>[] = [];
  const edges: Edge[] = [];
  const widthMap = new Map<string, number>();

  const calcWidth = (node: MarketingAgentNode): number => {
    const cached = widthMap.get(node.id);
    if (cached) return cached;

    if (!node.children || node.children.length === 0) {
      widthMap.set(node.id, NODE_WIDTH);
      return NODE_WIDTH;
    }

    let width = 0;
    node.children.forEach((child, index) => {
      const childWidth = calcWidth(child);
      width += childWidth;
      if (index < node.children!.length - 1) width += H_GAP;
    });

    const finalWidth = Math.max(NODE_WIDTH, width);
    widthMap.set(node.id, finalWidth);
    return finalWidth;
  };

  const layoutNode = (node: MarketingAgentNode, centerX: number, y: number) => {
    nodes.push({
      id: node.id,
      type: "agent",
      data: { name: node.name, phone: node.phone, level: node.level, isRoot: node.level === 0 },
      position: { x: centerX - NODE_WIDTH / 2, y },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top
    });

    if (!node.children || node.children.length === 0) return;

    const totalChildrenWidth = node.children.reduce((sum, child, index) => {
      const childWidth = calcWidth(child);
      return sum + childWidth + (index === 0 ? 0 : H_GAP);
    }, 0);

    let startX = centerX - totalChildrenWidth / 2;
    node.children.forEach((child) => {
      const childWidth = calcWidth(child);
      const childCenterX = startX + childWidth / 2;

      edges.push({
        id: `${node.id}-${child.id}`,
        source: node.id,
        target: child.id,
        type: "smoothstep",
        animated: true,
        style: {
          stroke: "#6366f1",
          strokeWidth: 2.25,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeDasharray: "2 6"
        }
      });

      layoutNode(child, childCenterX, y + NODE_HEIGHT + V_GAP);
      startX += childWidth + H_GAP;
    });
  };

  if (roots.length > 0) {
    const totalWidth = roots.reduce((sum, root, index) => {
      const width = calcWidth(root);
      return sum + width + (index === 0 ? 0 : H_GAP);
    }, 0);

    let currentX = -totalWidth / 2;
    roots.forEach((root) => {
      const rootWidth = calcWidth(root);
      const rootCenterX = currentX + rootWidth / 2;
      layoutNode(root, rootCenterX, 0);
      currentX += rootWidth + H_GAP;
    });
  }

  return { nodes, edges };
};

export default function MarketingAgentDashboard() {
  const { user } = useAuthContext();
  const [tree, setTree] = useState<MarketingAgentNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadNetwork = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await marketingAgentService.getNetwork();
        // Backend returns { success, data: { success, tree } } or { success, tree }
        const raw = (res as { data?: { tree?: MarketingAgentNode[] }; tree?: MarketingAgentNode[] }) ?? {};
        const list = Array.isArray(raw.data?.tree) ? raw.data.tree : Array.isArray(raw.tree) ? raw.tree : [];
        setTree(list);
      } catch (err) {
        console.error("Failed to load marketing network", err);
        setError("Unable to load network. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    loadNetwork();
  }, []);

  const filteredTree = useMemo(() => {
    if (!search.trim()) return tree;
    const q = search.toLowerCase();
    return tree
      .map((node) => filterTree(node, q))
      .filter((node): node is MarketingAgentNode => Boolean(node));
  }, [tree, search]);

  const { nodes, edges } = useMemo(() => buildGraph(filteredTree), [filteredTree]);
  const edgeDefaults = useMemo(
    () => ({
      type: "smoothstep" as const,
      animated: true,
      style: { stroke: "#6366f1", strokeWidth: 2.25, strokeDasharray: "2 6" },
      markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: "#6366f1" }
    }),
    []
  );

  const totalAgents = useMemo(() => {
    const count = (nodes: MarketingAgentNode[]): number =>
      nodes.reduce((acc, n) => acc + 1 + (n.children?.length ? count(n.children) : 0), 0);
    return count(tree);
  }, [tree]);

  return (
    <div className="py-6 sm:py-8 space-y-6 sm:space-y-8 pb-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-100 bg-white shadow-sm shadow-slate-200/50">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 via-white to-slate-50/80" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-200/25 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-cyan-200/20 blur-3xl" />
        <div className="relative p-5 sm:p-8 flex flex-col gap-5 sm:gap-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600">Marketing Agent</p>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight mt-0.5">
                  Network Overview
                </h1>
                <p className="text-sm sm:text-base text-slate-600 mt-1">
                  Welcome back, {user?.name || "Agent"}. View and manage your downline.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/90 border border-slate-100 shadow-sm text-xs font-semibold text-slate-700">
                <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                Live view
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-700">
                <Users className="w-4 h-4 shrink-0" />
                {totalAgents} agent{totalAgents !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Network section */}
      <section className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Team Network</h2>
            <p className="text-sm text-slate-500 mt-0.5">Pan and zoom to explore. Search to filter.</p>
          </div>
          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or phone..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
            />
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {error && (
            <div className="mb-4 flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 sm:py-24 gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
                <Network className="w-6 h-6 text-indigo-600 animate-pulse" />
              </div>
              <p className="text-sm font-medium text-slate-500">Loading network...</p>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-indigo-300 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          ) : nodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 sm:py-24 text-center px-4">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Users className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No agents yet</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">
                {search.trim() ? "No matches for your search. Try a different name or phone." : "Recruit agents to see your network here."}
              </p>
            </div>
          ) : (
            <div
              className="relative rounded-xl sm:rounded-2xl border border-slate-200 overflow-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.06),transparent_50%),radial-gradient(circle_at_50%_100%,rgba(14,165,233,0.05),transparent_50%)] w-full h-[380px] sm:h-[480px] lg:h-[560px]"
            >
              <div className="pointer-events-none absolute left-3 top-3 sm:left-4 sm:top-4 z-10 inline-flex items-center gap-2 rounded-lg bg-white/90 backdrop-blur px-3 py-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 shadow-sm">
                Drag to pan · Pinch to zoom
              </div>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={{ agent: AgentNode }}
                fitView
                defaultEdgeOptions={edgeDefaults}
                panOnScroll
                zoomOnScroll
                zoomOnPinch
                minZoom={0.2}
                maxZoom={2}
              >
                <Background gap={20} size={1} color="#e2e8f0" />
                <MiniMap
                  className="!bg-slate-50 !border-slate-200 hidden sm:block"
                  nodeStrokeColor="#6366f1"
                  nodeColor="#e0e7ff"
                  nodeBorderRadius={12}
                />
                <Controls showInteractive={false} className="!right-3 !bottom-3 sm:!right-4 sm:!bottom-4 !border-slate-200 !bg-white !rounded-xl !shadow-md" />
              </ReactFlow>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function AgentNode({ data }: { data: AgentNodeData }) {
  return (
    <div className="relative min-w-[200px] sm:min-w-[240px] rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-100/50 hover:border-indigo-200/80">
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 to-white rounded-t-2xl">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {data.isRoot ? (
            <span className="inline-flex items-center gap-1 text-indigo-600">
              <Crown className="w-3 h-3" /> Root
            </span>
          ) : (
            <span>Level {data.level}</span>
          )}
        </div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-full">
          L{data.level}
        </span>
      </div>
      <div className="px-3 sm:px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-100 border border-indigo-200/50 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
            {data.name.charAt(0) || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 truncate text-sm sm:text-base">{data.name}</p>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
              <Phone className="w-3 h-3 shrink-0" /> {data.phone}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
