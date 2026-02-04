"use client";

import React, { useEffect, useState } from "react";
import { useAuthContext } from "@/state/AuthContext";
import { agentService, HierarchyData, RegisterAgentRequest } from "@/services/agent.service";
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  ChevronRight,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Search,
  ChevronDown,
  ChevronUp,
  MapPin,
  Smartphone,
  Lock,
  ExternalLink,
  CloudUpload
} from "lucide-react";
import Link from "next/link";

type TabType = 'overview' | 'network' | 'register' | 'kyc';

export default function AgentDashboard() {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [hierarchy, setHierarchy] = useState<HierarchyData | null>(null);
  const [loadingHierarchy, setLoadingHierarchy] = useState(false);

  useEffect(() => {
    if (user?.id) {
      setLoadingHierarchy(true);
      agentService.getHierarchy(user.id)
        .then(res => {
          if (res.success) setHierarchy(res.data);
        })
        .catch(err => console.error("Error loading hierarchy:", err))
        .finally(() => setLoadingHierarchy(false));
    }
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Top Navigation / Hero */}
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
            <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<TrendingUp size={18} />} label="Overview" />
            <TabButton active={activeTab === 'network'} onClick={() => setActiveTab('network')} icon={<Users size={18} />} label="My Network" badge={hierarchy?.totalAgents} />
            <TabButton active={activeTab === 'register'} onClick={() => setActiveTab('register')} icon={<UserPlus size={18} />} label="Add Agent" />
            <TabButton active={activeTab === 'kyc'} onClick={() => setActiveTab('kyc')} icon={<ShieldCheck size={18} />} label="KYC & Compliance" />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {activeTab === 'overview' && <OverviewTab user={user} hierarchy={hierarchy} />}
        {activeTab === 'network' && <NetworkTab hierarchy={hierarchy} loading={loadingHierarchy} />}
        {activeTab === 'register' && <RegisterTab user={user} />}
        {activeTab === 'kyc' && <KYCTab user={user} />}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon, label, badge }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 pb-4 border-b-2 font-bold transition-all whitespace-nowrap px-1 relative ${active ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
    >
      {icon}
      <span>{label}</span>
      {badge !== undefined && (
        <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-lg ml-1">
          {badge}
        </span>
      )}
      {active && <div className="absolute bottom-[-2px] left-0 right-0 h-0.5 bg-cyan-600 rounded-full shadow-[0_0_10px_rgba(8,145,178,0.5)]" />}
    </button>
  );
}

// --- TAB COMPONENTS ---

function OverviewTab({ user, hierarchy }: any) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Total Network"
          value={hierarchy?.totalAgents || 0}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
          <h3 className="text-xl font-black text-gray-900 border-b border-gray-50 pb-4">Agent Profile Summary</h3>
          <div className="space-y-4">
            <ProfileItem label="Full Name" value={user?.name} />
            <ProfileItem label="Registered ID" value={`RMDA-${user?.id?.slice(-6).toUpperCase()}`} />
            <ProfileItem label="Primary Contact" value={user?.phone || user?.email} />
            <ProfileItem label="Assigned Dashboard" value={user?.dashboard?.toUpperCase()} />
          </div>
        </div>

        <div className="bg-gray-900 p-8 rounded-[40px] text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
          <div className="relative z-10 space-y-6">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <TrendingUp className="text-cyan-400" />
            </div>
            <h3 className="text-2xl font-black tracking-tight">Expand Your Network</h3>
            <p className="text-white/60 font-medium leading-relaxed">Register more health agents under your ID to grow the RM Docto ecosystem and earn specialized commissions.</p>
            <button className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-bold rounded-2xl transition-all shadow-xl shadow-cyan-900/50">
              Invite New Agent
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NetworkTab({ hierarchy, loading }: any) {
  if (loading) return (
    <div className="py-32 flex flex-col items-center justify-center gap-4 text-gray-400">
      <div className="w-10 h-10 border-4 border-gray-100 border-t-cyan-600 rounded-full animate-spin" />
      <p className="font-bold uppercase tracking-widest text-[10px]">Mapping Network...</p>
    </div>
  );

  const agents = hierarchy?.agents || [];

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black text-gray-900 tracking-tight">My Downline Hierarchy</h3>
        <div className="text-xs font-black text-gray-400 uppercase tracking-widest bg-white px-4 py-2 rounded-xl border border-gray-100">
          Total Team: {hierarchy?.totalAgents || 0}
        </div>
      </div>

      {agents.length === 0 ? (
        <div className="bg-white p-20 rounded-[40px] border border-gray-100 text-center space-y-4">
          <div className="w-20 h-20 bg-gray-50 rounded-[32px] mx-auto flex items-center justify-center text-gray-200">
            <Users size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Your network is empty</h3>
          <p className="text-gray-400 font-medium">Start building your team by registering your first agent.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent: any) => (
            <div key={agent._id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:border-cyan-100 transition-all group">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-cyan-600 font-black text-xl group-hover:bg-cyan-600 group-hover:text-white transition-all">
                  {agent.agentName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-gray-900 truncate">{agent.agentName}</h4>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Level {agent.level}</p>
                </div>
                <StatusDot status={agent.status} />
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-50">
                <IconInfo icon={<Smartphone size={14} />} label={agent.phone} />
                <IconInfo icon={<MapPin size={14} />} label={agent.city || "Area not set"} />
                <IconInfo icon={<Clock size={14} />} label={`Joined: ${new Date(agent.createdAt).toLocaleDateString()}`} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RegisterTab({ user }: any) {
  const [formData, setFormData] = useState({
    agentName: "",
    phone: "",
    password: "",
    latitude: 0,
    longitude: 0,
    address: "",
    city: "",
    state: "",
    pincode: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await agentService.registerAgent({
        ...formData,
        parentAgentId: user.id
      });
      if (res.success) {
        setSuccess(true);
        setFormData({
          agentName: "",
          phone: "",
          password: "",
          latitude: 0,
          longitude: 0,
          address: "",
          city: "",
          state: "",
          pincode: ""
        });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="max-w-xl mx-auto py-20 bg-white rounded-[40px] border border-gray-100 text-center space-y-6 shadow-sm">
      <div className="w-20 h-20 bg-emerald-50 rounded-[32px] mx-auto flex items-center justify-center text-emerald-600">
        <CheckCircle2 size={32} />
      </div>
      <h3 className="text-2xl font-black text-gray-900">Agent Registration Successful!</h3>
      <p className="text-gray-500 font-medium">The new agent has been added to your network.</p>
      <button onClick={() => setSuccess(false)} className="px-10 py-3.5 bg-gray-900 text-white rounded-2xl font-bold shadow-xl">Register Another</button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom-8 duration-500">
      <div className="bg-white p-8 md:p-12 rounded-[40px] border border-gray-100 shadow-sm space-y-10">
        <div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">Onboard New Agent</h3>
          <p className="text-gray-500 mt-1 font-medium">Fill in the primary details to register a downline partner.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Agent Full Name" value={formData.agentName} onChange={(e: any) => setFormData({ ...formData, agentName: e.target.value })} />
            <Input label="Mobile Number" value={formData.phone} onChange={(e: any) => setFormData({ ...formData, phone: e.target.value })} />
          </div>
          <Input label="System Password" type="password" value={formData.password} onChange={(e: any) => setFormData({ ...formData, password: e.target.value })} />

          <div className="pt-8 border-t border-gray-50">
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Service Area Identification</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="City" value={formData.city} onChange={(e: any) => setFormData({ ...formData, city: e.target.value })} />
              <Input label="Pincode" value={formData.pincode} onChange={(e: any) => setFormData({ ...formData, pincode: e.target.value })} />
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full py-4.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-cyan-100 disabled:bg-gray-100 disabled:text-gray-400 flex items-center justify-center gap-3 mt-4"
          >
            {loading ? "Processing..." : <>Confirm Registration <UserPlus size={20} /></>}
          </button>
        </form>
      </div>
    </div>
  );
}

function KYCTab({ user }: any) {
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<"AGREEMENT" | "LICENSE">("AGREEMENT");
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("userId", user.id);
      formData.append("documentType", selectedType);
      formData.append("file", file);

      const res = await agentService.uploadAgreement(formData);
      if (res.success) {
        alert("Document uploaded successfully and is pending verification.");
        setFile(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Status Tracker */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-10 pb-6 border-b border-gray-50">
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Compliance & Status</h3>
                <p className="text-sm text-gray-500 font-medium">Tracking your official RM Docto clearance.</p>
              </div>
              <div className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest ${user?.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                Account: {user?.isActive ? 'ACTIVE' : 'INACTIVE'}
              </div>
            </div>

            <div className="space-y-6">
              <KYCItem
                label="Identity Verification (Aadhaar/PAN)"
                status={user?.kycStatus === 'verified' ? 'VERIFIED' : user?.kycStatus === 'pending' ? 'PENDING' : 'REQUIRED'}
                desc="Verify your unique ID records for legal compliance."
              />
              <KYCItem
                label="Agent Service Agreement"
                status="APPROVED"
                desc="Digitally signed legal contract between the Agent and RM Docto."
              />
              <KYCItem
                label="Biometric Enrollment"
                status="COMPLETED"
                desc="Face recognition data for biometric attendance marking."
              />
            </div>
          </div>
        </div>

        {/* Right: Upload Hub */}
        <div className="space-y-6">
          <div className="bg-gray-900 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
            <h3 className="text-lg font-black tracking-tight mb-6">Document Hub</h3>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Select Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedType("AGREEMENT")}
                    className={`py-2 rounded-xl text-[10px] font-black border transition-all ${selectedType === "AGREEMENT" ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-white/5 border-white/10 text-gray-400'}`}
                  >
                    AGREEMENT
                  </button>
                  <button
                    onClick={() => setSelectedType("LICENSE")}
                    className={`py-2 rounded-xl text-[10px] font-black border transition-all ${selectedType === "LICENSE" ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-white/5 border-white/10 text-gray-400'}`}
                  >
                    LICENSE
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Choose File</label>
                <div className="relative group">
                  <input
                    type="file"
                    onChange={(e: any) => setFile(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full bg-white/5 border border-dashed border-white/20 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 group-hover:border-cyan-500/50 transition-all">
                    <CloudUpload className="text-gray-500 group-hover:text-cyan-400" size={24} />
                    <span className="text-[10px] font-bold text-gray-400 truncate max-w-[150px]">
                      {file ? file.name : "Select PDF or Image"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                disabled={!file || uploading}
                onClick={handleUpload}
                className="w-full py-4 bg-white text-gray-900 rounded-2xl font-black text-sm shadow-xl shadow-cyan-900/40 hover:bg-cyan-50 transition-all disabled:opacity-30 flex items-center justify-center gap-2 mt-4"
              >
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Submit Document <ExternalLink size={16} /></>
                )}
              </button>
            </div>
          </div>

          <div className="bg-amber-50/50 p-6 rounded-[32px] border border-amber-100/50 flex gap-4 items-start">
            <AlertCircle className="text-amber-500 shrink-0 mt-1" size={20} />
            <p className="text-[11px] text-amber-700 font-bold leading-relaxed">Ensure all uploads are clear and within the 5MB limit for faster approval.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SUBCOMPONENTS ---

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
    <div className="space-y-2">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
      <input
        {...props}
        className="w-full bg-gray-50 border border-transparent focus:bg-white focus:ring-4 focus:ring-cyan-50 focus:border-cyan-200 rounded-2xl py-4 px-6 font-bold text-gray-900 outline-none transition-all"
      />
    </div>
  );
}

function KYCItem({ label, status, desc }: any) {
  const isVerified = status === 'VERIFIED' || status === 'APPROVED' || status === 'COMPLETED';
  const isPending = status === 'PENDING';

  return (
    <div className="p-6 bg-gray-50/50 rounded-3xl border border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors hover:bg-gray-50">
      <div className="space-y-1">
        <h4 className="font-black text-gray-900 leading-none">{label}</h4>
        <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-sm">{desc}</p>
      </div>
      <div className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-[0.15em] whitespace-nowrap flex items-center gap-2
                ${isVerified ? 'bg-emerald-100 text-emerald-700' : isPending ? 'bg-amber-100 text-amber-700' : 'bg-red-50 text-red-600'}
            `}>
        {isVerified ? <CheckCircle2 size={12} /> : isPending ? <Clock size={12} /> : <AlertCircle size={12} />}
        {status}
      </div>
    </div>
  );
}

function IconInfo({ icon, label }: any) {
  return (
    <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
      <span className="text-cyan-600">{icon}</span>
      <span className="truncate">{label}</span>
    </div>
  );
}

function ProfileItem({ label, value }: any) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm font-bold text-gray-400">{label}</span>
      <span className="text-sm font-black text-gray-900 uppercase tracking-tight">{value}</span>
    </div>
  );
}

function StatusDot({ status }: any) {
  const color = status === 'ACTIVE' ? 'bg-emerald-500' : status === 'SUSPENDED' ? 'bg-red-500' : 'bg-amber-500';
  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-[8px] font-black uppercase text-gray-300">{status}</span>
    </div>
  );
}
