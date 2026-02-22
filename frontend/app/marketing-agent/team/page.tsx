"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search, Users, Phone, Layers, ArrowDownRight } from "lucide-react";

import { marketingAgentService, type MarketingAgentNode } from "@/services/marketingAgent.service";

type TeamMember = {
  id: string;
  name: string;
  phone: string;
  level: number;
  parentName?: string | null;
  directReports: number;
};

const flattenTree = (nodes: MarketingAgentNode[], parentName?: string | null): TeamMember[] => {
  return nodes.flatMap((node) => {
    const current: TeamMember = {
      id: node.id,
      name: node.name,
      phone: node.phone,
      level: node.level,
      parentName: parentName || null,
      directReports: node.children?.length || 0
    };

    const children = node.children?.length ? flattenTree(node.children, node.name) : [];
    return [current, ...children];
  });
};

export default function MarketingAgentTeamPage() {
  const [tree, setTree] = useState<MarketingAgentNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");

  useEffect(() => {
    const loadNetwork = async () => {
      setLoading(true);
      try {
        const res = await marketingAgentService.getNetwork();
        setTree(res.data?.tree || []);
      } catch (err) {
        console.error("Failed to load marketing network", err);
        setError("Failed to load team");
      } finally {
        setLoading(false);
      }
    };

    loadNetwork();
  }, []);

  const members = useMemo(() => flattenTree(tree), [tree]);

  const maxLevel = useMemo(
    () => members.reduce((max, member) => Math.max(max, member.level), 0),
    [members]
  );

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((member) => {
      const matchQuery =
        !q ||
        member.name.toLowerCase().includes(q) ||
        member.phone.toLowerCase().includes(q) ||
        (member.parentName || "").toLowerCase().includes(q);
      const matchLevel = levelFilter === "all" || member.level === Number(levelFilter);
      return matchQuery && matchLevel;
    });
  }, [members, search, levelFilter]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="relative overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-white to-indigo-50" />
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="relative p-5 sm:p-7 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="w-11 h-11 bg-cyan-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-cyan-200">
              <Users />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-700">Marketing Agent</p>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900">My Team</h1>
              <p className="text-sm text-gray-600 font-medium">All team members in a clean list view.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0 sm:pb-0">
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white border border-gray-100 text-[11px] font-black text-gray-600 whitespace-nowrap">
              <Layers size={14} className="text-cyan-600" />
              {members.length} total members
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white border border-gray-100 text-[11px] font-black text-gray-600 whitespace-nowrap">
              Levels 0 - {maxLevel}
            </div>
          </div>
        </div>
      </div>

      <section className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-50 flex flex-col gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-gray-900">Team Members</h2>
            <p className="text-sm text-gray-500">Search by name, phone, or manager.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search team members"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="w-full sm:w-40 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All levels</option>
              {Array.from({ length: maxLevel + 1 }).map((_, level) => (
                <option key={level} value={level}>
                  Level {level}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-xl mb-4">{error}</div>}
          {loading ? (
            <div className="py-16 text-center text-gray-400">Loading team...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="py-16 text-center text-gray-400">No members found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_16px_32px_rgba(15,23,42,0.08)] transition-transform duration-200 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Level {member.level}</p>
                      <p className="text-lg font-black text-slate-900 mt-1 truncate">{member.name}</p>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest bg-cyan-50 text-cyan-700 border border-cyan-100 px-2 py-1 rounded-full">
                      L{member.level}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                    <Phone size={14} />
                    <span className="font-semibold">{member.phone}</span>
                  </div>

                  <div className="mt-3 text-xs text-slate-500 flex items-center gap-2">
                    <ArrowDownRight size={14} className="text-slate-400" />
                    <span className="font-semibold">Manager:</span>
                    <span className="truncate">{member.parentName || "—"}</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>Direct reports</span>
                    <span className="text-slate-900">{member.directReports}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
