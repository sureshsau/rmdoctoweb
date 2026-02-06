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
  type Node
} from "reactflow";
import "reactflow/dist/style.css";
import { Search, ShieldCheck, Phone, Crown, Sparkles } from "lucide-react";

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
          stroke: "#0ea5e9",
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
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [geoError, setGeoError] = useState<string | null>(null);
  const [form, setForm] = useState({
    agentName: "",
    phone: "",
    password: "",
    latitude: "",
    longitude: "",
    address: "",
    city: "",
    state: "",
    pincode: ""
  });

  useEffect(() => {
    const loadNetwork = async () => {
      setLoading(true);
      try {
        const res = await marketingAgentService.getNetwork();
        setTree(res.data?.tree || []);
      } catch (err) {
        console.error("Failed to load marketing network", err);
        setError("Failed to load network");
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
      style: { stroke: "#0ea5e9", strokeWidth: 2.25, strokeDasharray: "2 6" },
      markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: "#0ea5e9" }
    }),
    []
  );

  const handleFormChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitState("loading");
    setSubmitError(null);

    try {
      const payload = {
        agentName: form.agentName.trim(),
        phone: form.phone.trim(),
        password: form.password || undefined,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        pincode: form.pincode.trim() || null
      };

      await marketingAgentService.registerAgent(payload);
      setSubmitState("success");
      setForm({
        agentName: "",
        phone: "",
        password: "",
        latitude: "",
        longitude: "",
        address: "",
        city: "",
        state: "",
        pincode: ""
      });
    } catch (err: any) {
      console.error("Failed to register agent", err);
      setSubmitState("error");
      setSubmitError(err?.response?.data?.message || "Failed to register agent");
    }
  };

  const handleGeoLocate = () => {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      setGeoError("Geolocation is not supported on this device.");
      return;
    }

    setGeoStatus("loading");
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString()
        }));
        setGeoStatus("success");
      },
      (error) => {
        setGeoStatus("error");
        setGeoError(error.message || "Unable to fetch location.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      <div className="relative overflow-hidden rounded-[24px] sm:rounded-[32px] border border-gray-100 bg-white shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-white to-indigo-50" />
        <div className="absolute -right-24 -top-24 h-52 w-52 sm:h-64 sm:w-64 rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="absolute -left-24 -bottom-24 h-52 w-52 sm:h-64 sm:w-64 rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="relative p-5 sm:p-8 flex flex-col gap-4 sm:gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-14 sm:h-14 bg-cyan-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-cyan-200">
              <ShieldCheck />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-700">Marketing Agent</p>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900">Network Command Center</h1>
              <p className="text-sm sm:text-base text-gray-600 font-medium">Welcome back, {user?.name || "Agent"}. Visualize your full downline.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0 sm:pb-0">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-white border border-gray-100 text-[11px] sm:text-xs font-black text-gray-600 whitespace-nowrap">
              <Sparkles size={14} className="text-cyan-600" />
              Live network view
            </div>
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-white border border-gray-100 text-[11px] sm:text-xs font-black text-gray-600 whitespace-nowrap">
              Root centered org chart
            </div>
          </div>
        </div>
      </div>

      <section className="bg-white rounded-[24px] sm:rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-gray-900">My Team Network</h2>
            <p className="text-sm text-gray-500">Root centered, children by level. Pan and zoom supported.</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search agents"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-xl mb-4">{error}</div>}
          {loading ? (
            <div className="py-16 text-center text-gray-400">Loading network...</div>
          ) : nodes.length === 0 ? (
            <div className="py-16 text-center text-gray-400">No agents found.</div>
          ) : (
            <div className="relative h-[60vh] sm:h-[72vh] rounded-[20px] sm:rounded-[28px] border border-gray-100 overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.08),_transparent_45%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.08),_transparent_45%)]">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-4 top-4 sm:left-6 sm:top-6 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-gray-500 shadow-sm">
                  Drag to pan • Pinch to zoom
                </div>
                <div className="sm:hidden absolute right-4 bottom-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-500 shadow-sm">
                  Tap a node to focus
                </div>
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
                <Background gap={18} size={1} color="#e2e8f0" />
                <MiniMap
                  className="hidden sm:block"
                  nodeStrokeColor="#0ea5e9"
                  nodeColor="#e0f2fe"
                  nodeBorderRadius={14}
                />
                <Controls showInteractive={false} className="!right-4 !bottom-4 sm:!right-6 sm:!bottom-6" />
              </ReactFlow>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white rounded-[24px] sm:rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-50 flex flex-col gap-2">
          <h2 className="text-lg sm:text-xl font-black text-gray-900">Register New Agent</h2>
          <p className="text-sm text-gray-500">Add agent details and location in one step.</p>
        </div>

        <form onSubmit={handleRegister} className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            {submitState === "success" && (
              <div className="bg-emerald-50 text-emerald-700 text-sm px-3 py-2 rounded-xl">
                Agent registered successfully.
              </div>
            )}
            {submitState === "error" && submitError && (
              <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-xl">
                {submitError}
              </div>
            )}
            {geoStatus === "error" && geoError && (
              <div className="mt-2 bg-amber-50 text-amber-700 text-sm px-3 py-2 rounded-xl">
                {geoError}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-widest text-gray-400">Agent Name</label>
            <input
              value={form.agentName}
              onChange={(e) => handleFormChange("agentName", e.target.value)}
              required
              placeholder="Full name"
              className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 text-sm focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-widest text-gray-400">Phone Number</label>
            <input
              value={form.phone}
              onChange={(e) => handleFormChange("phone", e.target.value)}
              required
              placeholder="10-digit phone"
              className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 text-sm focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-widest text-gray-400">Password</label>
            <input
              value={form.password}
              onChange={(e) => handleFormChange("password", e.target.value)}
              type="password"
              placeholder="Optional"
              className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 text-sm focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-widest text-gray-400">Address</label>
            <input
              value={form.address}
              onChange={(e) => handleFormChange("address", e.target.value)}
              placeholder="House, street, area"
              className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 text-sm focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-widest text-gray-400">City</label>
            <input
              value={form.city}
              onChange={(e) => handleFormChange("city", e.target.value)}
              placeholder="City"
              className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 text-sm focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-widest text-gray-400">State</label>
            <input
              value={form.state}
              onChange={(e) => handleFormChange("state", e.target.value)}
              placeholder="State"
              className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 text-sm focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-widest text-gray-400">Pincode</label>
            <input
              value={form.pincode}
              onChange={(e) => handleFormChange("pincode", e.target.value)}
              placeholder="Pincode"
              className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 text-sm focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="button"
              onClick={handleGeoLocate}
              className="w-full sm:w-auto px-4 py-2.5 rounded-2xl border border-cyan-100 bg-cyan-50 text-cyan-700 text-sm font-bold hover:bg-cyan-100"
            >
              {geoStatus === "loading" ? "Getting location..." : "Use current location"}
            </button>
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-widest text-gray-400">Latitude</label>
            <input
              value={form.latitude}
              onChange={(e) => handleFormChange("latitude", e.target.value)}
              required
              inputMode="decimal"
              placeholder="Latitude"
              className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 text-sm focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-widest text-gray-400">Longitude</label>
            <input
              value={form.longitude}
              onChange={(e) => handleFormChange("longitude", e.target.value)}
              required
              inputMode="decimal"
              placeholder="Longitude"
              className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 text-sm focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center gap-3">
            <button
              type="submit"
              disabled={submitState === "loading"}
              className="px-6 py-3 rounded-2xl bg-cyan-600 text-white font-bold shadow-lg shadow-cyan-100 hover:bg-cyan-700 disabled:opacity-60"
            >
              {submitState === "loading" ? "Registering..." : "Register Agent"}
            </button>
            <p className="text-xs text-gray-500">Latitude/Longitude is required by backend validation.</p>
          </div>
        </form>
      </section>
    </div>
  );
}

function AgentNode({ data }: { data: AgentNodeData }) {
  return (
    <div className="relative min-w-[240px] rounded-[24px] border border-slate-200/70 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.12)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(14,116,144,0.18)]">
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-gradient-to-r from-cyan-50 via-white to-white rounded-t-[24px]">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
          {data.isRoot ? (
            <span className="inline-flex items-center gap-1 text-cyan-700">
              <Crown size={12} /> Root
            </span>
          ) : (
            <span>Level {data.level}</span>
          )}
        </div>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white border border-slate-100 px-2 py-0.5 rounded-full">
          L{data.level}
        </span>
      </div>
      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-700 font-black shadow-[0_8px_18px_rgba(14,165,233,0.2)]">
            {data.name.charAt(0) || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-slate-900 truncate">{data.name}</p>
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <Phone size={12} /> {data.phone}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
