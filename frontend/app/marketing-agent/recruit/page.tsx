"use client";

import React, { useState } from "react";
import { UserPlus, MapPin, Phone, ShieldCheck } from "lucide-react";

import { marketingAgentService } from "@/services/marketingAgent.service";

export default function MarketingAgentRecruitPage() {
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="relative overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-white to-indigo-50" />
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="relative p-5 sm:p-7 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="w-11 h-11 bg-cyan-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-cyan-200">
              <UserPlus />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-700">Marketing Agent</p>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Recruit New Agent</h1>
              <p className="text-sm text-gray-600 font-medium">Register a new agent with verified location details.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0 sm:pb-0">
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white border border-gray-100 text-[11px] font-black text-gray-600 whitespace-nowrap">
              <ShieldCheck size={14} className="text-cyan-600" />
              Agent create permission required
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white border border-gray-100 text-[11px] font-black text-gray-600 whitespace-nowrap">
              <MapPin size={14} className="text-cyan-600" />
              GPS required
            </div>
          </div>
        </div>
      </div>

      <section className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-50 flex flex-col gap-2">
          <h2 className="text-lg sm:text-xl font-black text-gray-900">Agent Registration</h2>
          <p className="text-sm text-gray-500">Fill all fields to register under your network.</p>
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
