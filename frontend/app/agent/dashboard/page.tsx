"use client";

import React, { useEffect, useState } from "react";
import ReactFlow, {
  Background,
  MiniMap,
  Controls,
  Position,
  Handle,
  ReactFlowProvider,
  useNodesState,
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { useAuthContext } from "@/state/AuthContext";
import { agentService } from "@/services/agent.service";
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Smartphone,
  MapPin,
  Copy,
  Eye,
  EyeOff,
  X
} from "lucide-react";
import Link from "next/link";

type TabType = 'overview' | 'network' | 'register';

export default function AgentDashboard() {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [hierarchy, setHierarchy] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchHierarchy();
    }
  }, [user?.id]);

  const fetchHierarchy = async () => {
    setLoading(true);
    try {
      const res = await agentService.getHierarchy();
      console.log("[AgentDashboard] Response:", res);
      
      // Handle the nested data structure from your API
      let data = res.data;
      if (data?.data) data = data.data;
      
      setHierarchy(data);
    } catch (err) {
      console.error("Error loading hierarchy:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Agent Workspace</h1>
              <p className="text-gray-500 font-medium mt-1">Manage your team, track growth, and facilitate health orders.</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/medicine-store"
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3.5 rounded-2xl font-bold transition-all shadow-xl shadow-cyan-100 hover:-translate-y-0.5"
              >
                <ShoppingBag size={20} />
                <span>Health Store</span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-lg ml-1">AGENT PRICING</span>
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-8 mt-10 overflow-x-auto no-scrollbar">
            <TabButton 
              active={activeTab === 'overview'} 
              onClick={() => setActiveTab('overview')} 
              icon={<TrendingUp size={18} />} 
              label="Overview" 
            />
            <TabButton 
              active={activeTab === 'network'} 
              onClick={() => setActiveTab('network')} 
              icon={<Users size={18} />} 
              label="My Network" 
              badge={hierarchy?.totalAgents} 
            />
            <TabButton 
              active={activeTab === 'register'} 
              onClick={() => setActiveTab('register')} 
              icon={<UserPlus size={18} />} 
              label="Add Agent" 
            />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {activeTab === 'overview' && <OverviewTab user={user} hierarchy={hierarchy} />}
        {activeTab === 'network' && (
          <ReactFlowProvider>
            <NetworkTab hierarchy={hierarchy} loading={loading} userId={user?.id} />
          </ReactFlowProvider>
        )}
        {activeTab === 'register' && <RegisterTab user={user} hierarchy={hierarchy} onSuccess={fetchHierarchy} />}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon, label, badge }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 pb-4 border-b-2 font-bold transition-all whitespace-nowrap px-1 relative ${
        active ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-gray-400 hover:text-gray-600'
      }`}
    >
      {icon}
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-lg ml-1">
          {badge}
        </span>
      )}
    </button>
  );
}

function OverviewTab({ user, hierarchy }: any) {
  // Calculate total network
  const countDownline = (tree: any[]): number => {
    if (!tree) return 0;
    let count = 0;
    for (const agent of tree) {
      count += 1 + countDownline(agent.children || []);
    }
    return count;
  };
  
  const totalNetwork = countDownline(hierarchy?.downlineTree || []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Total Network"
          value={totalNetwork}
          sub="Active Downlines"
          icon={<Users size={24} />}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="KYC Status"
          value={user?.kycStatus?.toUpperCase() || "PENDING"}
          sub="Account Compliance"
          icon={<ShieldCheck size={24} />}
          color={user?.kycStatus === 'verified' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}
        />
        <StatCard
          label="Agent Status"
          value="ACTIVE"
          sub="System Clearance"
          icon={<Package size={24} />}
          color="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Marketing Agent Info */}
      {hierarchy?.marketingAgent && (
        <div className="bg-white p-6 rounded-[32px] border border-cyan-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Your Marketing Agent</p>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-700 font-black text-xl">
              {hierarchy.marketingAgent.name?.charAt(0) || 'M'}
            </div>
            <div>
              <h4 className="font-black text-gray-900">{hierarchy.marketingAgent.name}</h4>
              <p className="text-sm text-gray-500 mt-1">{hierarchy.marketingAgent.phone}</p>
              <p className="text-xs text-cyan-600 font-bold mt-1">Marketing Agent</p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Summary */}
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
        <h3 className="text-xl font-black text-gray-900 border-b border-gray-50 pb-4 mb-6">Agent Profile Summary</h3>
        <div className="space-y-4">
          <ProfileItem label="Full Name" value={user?.name} />
          <ProfileItem label="Registered ID" value={`RMDA-${user?.id?.slice(-6).toUpperCase()}`} />
          <ProfileItem label="Primary Contact" value={user?.phone || user?.email} />
          <ProfileItem label="Assigned Dashboard" value={user?.dashboard?.toUpperCase()} />
          <ProfileItem label="Your Level" value={`Level ${hierarchy?.self?.level || 0}`} />
        </div>
      </div>
    </div>
  );
}

// Network Tab Component
function NetworkTab({ hierarchy, loading, userId }: any) {
  const [search, setSearch] = useState("");
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (hierarchy?.downlineTree) {
      buildFlow();
    }
  }, [hierarchy]);

  // Dagre layout configuration
  const getLayoutedElements = (nodes: any[], edges: any[], direction = 'LR') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: direction });

    const nodeWidth = 250;
    const nodeHeight = 100;

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      node.targetPosition = direction === 'LR' ? Position.Left : Position.Top;
      node.sourcePosition = direction === 'LR' ? Position.Right : Position.Bottom;
      node.position = {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      };
    });

    return { nodes, edges };
  };

  // Custom Agent Node
  const AgentNode = ({ data }: any) => {
    return (
      <div className="relative group">
        <Handle type="target" position={Position.Left} className="w-2 h-2 bg-cyan-400" />
        <div className="bg-white rounded-2xl shadow-lg border-2 border-cyan-100 hover:border-cyan-400 transition-all p-4 min-w-[220px]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
              {data.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-gray-900 text-sm truncate max-w-[120px]">{data.name}</h4>
                <span className="text-[8px] font-black bg-cyan-50 text-cyan-700 px-1.5 py-0.5 rounded-lg">
                  L{data.level}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-500">
                <Smartphone size={10} />
                <span className="truncate max-w-[100px]">{data.phone}</span>
              </div>
            </div>
          </div>
          {data.isYou && (
            <div className="absolute -top-2 -right-2 bg-cyan-600 text-white text-[8px] font-black px-2 py-1 rounded-full shadow-lg">
              YOU
            </div>
          )}
        </div>
        <Handle type="source" position={Position.Right} className="w-2 h-2 bg-cyan-400" />
      </div>
    );
  };

  const nodeTypes = { agent: AgentNode };

  const buildFlow = () => {
    const flowNodes: any[] = [];
    const flowEdges: any[] = [];

    const processAgent = (agent: any, parentId?: string) => {
      const agentId = agent._id || agent.id;
      
      flowNodes.push({
        id: agentId,
        type: 'agent',
        data: {
          name: agent.name,
          phone: agent.phone,
          level: agent.level || 1,
          status: agent.status,
          isYou: agentId === userId
        },
        position: { x: 0, y: 0 },
      });

      if (parentId) {
        flowEdges.push({
          id: `edge-${parentId}-${agentId}`,
          source: parentId,
          target: agentId,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#0891b2', strokeWidth: 2 },
        });
      }

      if (agent.children?.length) {
        agent.children.forEach((child: any) => processAgent(child, agentId));
      }
    };

    hierarchy.downlineTree.forEach((agent: any) => processAgent(agent));
    
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(flowNodes, flowEdges, 'LR');
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  };

  const filteredNodes = search.trim()
    ? nodes.filter((node: any) =>
        node.data.name.toLowerCase().includes(search.toLowerCase()) ||
        node.data.phone.includes(search)
      )
    : nodes;

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-4 text-gray-400">
        <div className="w-10 h-10 border-4 border-gray-100 border-t-cyan-600 rounded-full animate-spin" />
        <p className="font-bold uppercase tracking-widest text-[10px]">Loading Network...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Team Network</h3>
        <div className="text-xs font-black text-gray-400 uppercase tracking-widest bg-white px-4 py-2 rounded-xl border border-gray-100">
          Total Team: {hierarchy?.totalAgents || 0}
        </div>
      </div>

      <section className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Network Visualization</h2>
            <p className="text-sm text-slate-500 mt-0.5">Pan and zoom to explore. Search to filter.</p>
          </div>
          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or phone..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-shadow"
            />
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {filteredNodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 sm:py-24 text-center px-4">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Users className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No agents yet</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">
                {search.trim() ? "No matches for your search." : "Recruit agents to see your network here."}
              </p>
            </div>
          ) : (
            <div className="relative rounded-xl sm:rounded-2xl border border-slate-200 overflow-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.06),transparent_50%),radial-gradient(circle_at_50%_100%,rgba(6,182,212,0.05),transparent_50%)] w-full h-[500px] sm:h-[600px]">
              <div className="pointer-events-none absolute left-3 top-3 sm:left-4 sm:top-4 z-10 inline-flex items-center gap-2 rounded-lg bg-white/90 backdrop-blur px-3 py-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 shadow-sm">
                Drag to pan · Scroll to zoom
              </div>
              <ReactFlow
                nodes={filteredNodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                defaultEdgeOptions={{
                  type: 'smoothstep',
                  animated: true,
                  style: { stroke: '#0891b2', strokeWidth: 2 },
                }}
                panOnScroll
                zoomOnScroll
                minZoom={0.2}
                maxZoom={1.5}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
              >
                <Background gap={20} size={1} color="#e2e8f0" />
                <MiniMap
                  className="!bg-slate-50 !border-slate-200 hidden sm:block"
                  nodeStrokeColor="#0891b2"
                  nodeColor="#cffafe"
                  nodeBorderRadius={12}
                />
                <Controls 
                  showInteractive={false} 
                  className="!right-3 !bottom-3 sm:!right-4 sm:!bottom-4 !border-slate-200 !bg-white !rounded-xl !shadow-md" 
                />
              </ReactFlow>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// Register Tab Component
function RegisterTab({ user, hierarchy, onSuccess }: any) {
  const [formData, setFormData] = useState({
    agentName: "",
    phone: "",
    password: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    latitude: "",
    longitude: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          }));
        },
        () => {
          setError("Unable to fetch location. Please allow location access.");
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.phone.length !== 10) {
      setError("Phone number must be 10 digits");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const requestData = {
        agentName: formData.agentName,
        phone: formData.phone,
        password: formData.password,
        email: formData.email || undefined,
        location: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          latitude: formData.latitude ? parseFloat(formData.latitude) : 0,
          longitude: formData.longitude ? parseFloat(formData.longitude) : 0
        }
      };

      const response = await agentService.registerAgent(requestData);
      if (response.success) {
        setSuccess(true);
        setFormData({
          agentName: "",
          phone: "",
          password: "",
          email: "",
          address: "",
          city: "",
          state: "",
          pincode: "",
          latitude: "",
          longitude: ""
        });
        onSuccess();
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-gradient-to-br from-cyan-600 to-cyan-700 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative">
          <h2 className="text-2xl font-black tracking-tight mb-2">Add New Agent</h2>
          <p className="text-cyan-100 text-sm font-medium">Expand your network by registering a new agent</p>
          
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="bg-white/10 rounded-2xl p-4">
              <p className="text-cyan-200 text-[10px] font-black uppercase tracking-widest">Your Level</p>
              <p className="text-2xl font-black mt-1">{hierarchy?.self?.level || 1}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4">
              <p className="text-cyan-200 text-[10px] font-black uppercase tracking-widest">Team Size</p>
              <p className="text-2xl font-black mt-1">{hierarchy?.totalAgents || 0}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4">
              <p className="text-cyan-200 text-[10px] font-black uppercase tracking-widest">Commission</p>
              <p className="text-2xl font-black mt-1">5%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
            <CheckCircle2 className="text-emerald-600 shrink-0" size={20} />
            <p className="text-emerald-700 font-bold text-sm">Agent registered successfully! 🎉</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
            <AlertCircle className="text-red-600 shrink-0" size={20} />
            <p className="text-red-700 font-bold text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name *"
              name="agentName"
              value={formData.agentName}
              onChange={handleChange}
              placeholder="Enter full name"
              required
            />
            <Input
              label="Phone *"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="10-digit mobile"
              maxLength={10}
              pattern="[0-9]{10}"
              required
            />
            <div className="relative">
              <Input
                label="Password *"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                placeholder="Create password"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[38px] text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="email@example.com"
            />
          </div>

          <div className="pt-4 border-t border-gray-50">
            <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
              <MapPin size={18} className="text-cyan-600" />
              Location Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Street address"
              />
              <Input
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="City"
              />
              <Input
                label="State"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="State"
              />
              <Input
                label="Pincode"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                placeholder="6-digit pincode"
                maxLength={6}
                pattern="[0-9]{6}"
              />
              <div className="flex gap-2">
                <Input
                  label="Latitude"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="28.6139"
                />
                <Input
                  label="Longitude"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="77.2090"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleLocation}
              className="mt-4 px-4 py-2 bg-cyan-50 text-cyan-700 rounded-xl font-bold text-sm border border-cyan-200 hover:bg-cyan-100 transition-all flex items-center gap-2"
            >
              <MapPin size={16} />
              Use My Current Location
            </button>
          </div>

          <div className="flex items-center gap-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white font-black py-4 px-6 rounded-2xl transition-all shadow-xl shadow-cyan-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  <span>Register Agent</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData({
                  agentName: "",
                  phone: "",
                  password: "",
                  email: "",
                  address: "",
                  city: "",
                  state: "",
                  pincode: "",
                  latitude: "",
                  longitude: ""
                });
                setError("");
              }}
              className="px-8 py-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-2xl transition-all border border-gray-200"
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Subcomponents
function StatCard({ label, value, sub, icon, color }: any) {
  return (
    <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex items-center gap-6 hover:shadow-xl transition-all group">
      <div className={`p-5 rounded-3xl transition-all group-hover:scale-110 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black text-gray-900 tracking-tight">{value}</p>
        <p className="text-xs text-gray-400 font-medium mt-1">{sub}</p>
      </div>
    </div>
  );
}

function Input({ label, ...props }: any) {
  return (
    <div className="space-y-2 w-full">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
      <input
        {...props}
        className="w-full bg-gray-50 border border-transparent focus:bg-white focus:ring-4 focus:ring-cyan-50 focus:border-cyan-200 rounded-2xl py-4 px-6 font-bold text-gray-900 outline-none transition-all"
      />
    </div>
  );
}

function ProfileItem({ label, value }: any) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm font-bold text-gray-400">{label}</span>
      <span className="text-sm font-black text-gray-900">{value || '—'}</span>
    </div>
  );
}