"use client";

import { useEffect, useMemo, useState, Fragment } from "react";
import Link from "next/link";
import {
    Stethoscope,
    ClipboardList,
    Search,
    Phone,
    Calendar,
    Clock,
    ChevronRight,
    Sparkles,
    Activity,
    Pill,
    TrendingUp,
    UserCircle,
    XCircle,
    CheckCircle,
    AlertCircle,
    MapPin,
    Video,
    Award,
    Star,
    Syringe,
    Scissors,
    Bone,
    Brain,
    Eye,
    Droplet,
    CalendarDays,
    Users,
    Download,
    Filter,
    MoreVertical,
    ChevronDown,
    Menu,
    X,
    Mail,
    Heart
} from "lucide-react";
import { useAuthContext } from "@/state/AuthContext";
import { userService } from "@/services/user.service";
import { orderService, OrderOverview } from "@/services/order.service";
import { AuthUser } from "@/services/auth.service";
import { Dialog, Transition } from "@headlessui/react";

const formatAmount = (value?: number) => {
    if (typeof value !== "number" || Number.isNaN(value)) return "—";
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

const getStatusColor = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; icon: any; lightBg: string }> = {
        completed: { bg: "bg-emerald-500", text: "text-emerald-700", icon: CheckCircle, lightBg: "bg-emerald-50" },
        pending: { bg: "bg-amber-500", text: "text-amber-700", icon: AlertCircle, lightBg: "bg-amber-50" },
        cancelled: { bg: "bg-rose-500", text: "text-rose-700", icon: XCircle, lightBg: "bg-rose-50" },
        processing: { bg: "bg-blue-500", text: "text-blue-700", icon: Activity, lightBg: "bg-blue-50" },
        delivered: { bg: "bg-teal-500", text: "text-teal-700", icon: CheckCircle, lightBg: "bg-teal-50" },
        shipped: { bg: "bg-indigo-500", text: "text-indigo-700", icon: TrendingUp, lightBg: "bg-indigo-50" },
        default: { bg: "bg-gray-500", text: "text-gray-700", icon: Clock, lightBg: "bg-gray-50" }
    };
    return statusMap[status.toLowerCase()] || statusMap.default;
};

const specialties = [
    { name: "Cardiology", icon: Heart, color: "rose" },
    { name: "Neurology", icon: Brain, color: "purple" },
    { name: "Pediatrics", icon: Syringe, color: "blue" },
    { name: "Orthopedics", icon: Bone, color: "amber" },
    { name: "Ophthalmology", icon: Eye, color: "indigo" },
    { name: "Dermatology", icon: Droplet, color: "pink" },
    { name: "General", icon: Stethoscope, color: "emerald" },
    { name: "Surgery", icon: Scissors, color: "orange" }
];

export default function ReceptionistDashboard() {
    const { user } = useAuthContext();
    const [doctors, setDoctors] = useState<AuthUser[]>([]);
    const [orders, setOrders] = useState<OrderOverview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [orderError, setOrderError] = useState<string | null>(null);
    const [orderMeta, setOrderMeta] = useState<{ fallback?: boolean; errorMessage?: string } | null>(null);

    const [doctorSearch, setDoctorSearch] = useState("");
    const [orderSearch, setOrderSearch] = useState("");
    const [activeTab, setActiveTab] = useState<"doctors" | "orders">("doctors");
    const [selectedTimeRange, setSelectedTimeRange] = useState<"today" | "week" | "month">("week");
    const [selectedSpecialty, setSelectedSpecialty] = useState<string>("all");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    const [selectedDoctor, setSelectedDoctor] = useState<AuthUser | null>(null);
    const [bookingModal, setBookingModal] = useState(false);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [form, setForm] = useState({
        patientName: "",
        patientPhone: "",
        patientAge: "",
        patientGender: "",
        appointmentDate: "",
        appointmentTime: "",
        consultationFee: "",
        symptoms: "",
        notes: "",
    });
    const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

    // Auto-hide toast after 3 seconds
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => {
                setToast(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);

            try {
                const [doctorRes, orderRes] = await Promise.all([
                    userService.getAllDoctors(),
                    orderService.getAllOrders()
                ]);
                if (doctorRes?.success) {
                    setDoctors(doctorRes.data || []);
                }
                if (orderRes?.success) {
                    setOrders(orderRes.data || []);
                    setOrderError(null);
                } else {
                    setOrderError(orderRes?.meta?.errorMessage || "Orders permission required");
                }
                setOrderMeta(orderRes?.meta ?? null);
            } catch (err) {
                console.error("Failed to load receptionist dashboard", err);
                setError("Failed to load dashboard data");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const filteredDoctors = useMemo(() => {
        let filtered = doctors;
        
        if (doctorSearch.trim()) {
            const q = doctorSearch.toLowerCase();
            filtered = filtered.filter((u) =>
                u.name.toLowerCase().includes(q) ||
                (u.phone || "").includes(q) ||
                (u.email || "").toLowerCase().includes(q) ||
                (u.specialty || "").toLowerCase().includes(q)
            );
        }
        
        if (selectedSpecialty !== "all") {
            filtered = filtered.filter((u) => 
                (u.specialty || "").toLowerCase() === selectedSpecialty.toLowerCase()
            );
        }
        
        return filtered;
    }, [doctors, doctorSearch, selectedSpecialty]);

    const filteredOrders = useMemo(() => {
        if (!orderSearch.trim()) return orders;
        const q = orderSearch.toLowerCase();
        return orders.filter((o) =>
            o.orderId.toLowerCase().includes(q) ||
            (o.orderStatus || "").toLowerCase().includes(q) ||
            (o.paymentStatus || "").toLowerCase().includes(q) ||
            (o.medicine?.name || "").toLowerCase().includes(q)
        );
    }, [orders, orderSearch]);

    const stats = useMemo(() => {
        const now = new Date();
        const today = now.toDateString();
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));

        const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
        const weekOrders = orders.filter(o => new Date(o.createdAt) >= weekAgo);
        const monthOrders = orders.filter(o => new Date(o.createdAt) >= monthAgo);

        const totalRevenue = orders.reduce((sum, o) => sum + (o.payableAmount || 0), 0);
        const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.payableAmount || 0), 0);
        const pendingOrders = orders.filter(o => o.orderStatus?.toLowerCase() === 'pending').length;

        const availableDoctors = doctors.filter(d => d.available).length;

        return {
            totalDoctors: doctors.length,
            availableDoctors,
            totalOrders: orders.length,
            todayOrders: todayOrders.length,
            weekOrders: weekOrders.length,
            monthOrders: monthOrders.length,
            totalRevenue,
            todayRevenue,
            pendingOrders,
            averageOrderValue: orders.length ? totalRevenue / orders.length : 0
        };
    }, [doctors, orders]);

    const StatCard = ({ title, value, icon: Icon, trend, color = "amber" }: any) => (
        <div className="group relative overflow-hidden rounded-xl bg-white p-4 sm:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium text-gray-500">{title}</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{value}</p>
                    {trend && (
                        <div className="flex items-center gap-1 mt-1">
                            <TrendingUp className={`w-3 h-3 ${trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`} />
                            <span className={`text-xs font-medium ${trend > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {trend > 0 ? '+' : ''}{trend}%
                            </span>
                        </div>
                    )}
                </div>
                <div className={`p-2.5 rounded-lg bg-${color}-50 text-${color}-600`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </div>
    );

    const TimeRangeSelector = () => (
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
            {["today", "week", "month"].map((range) => (
                <button
                    key={range}
                    onClick={() => setSelectedTimeRange(range as any)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                        selectedTimeRange === range
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
            ))}
        </div>
    );

    const SpecialtyFilter = () => (
        <div className="relative">
            <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-emerald-500 hover:text-emerald-600 transition-all"
            >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">{selectedSpecialty === "all" ? "All Specialties" : selectedSpecialty}</span>
                <span className="sm:hidden">Filter</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            
            {showFilters && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
                    <button
                        onClick={() => { setSelectedSpecialty("all"); setShowFilters(false); }}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                            selectedSpecialty === "all" 
                                ? "bg-emerald-50 text-emerald-700 font-medium" 
                                : "hover:bg-gray-50 text-gray-700"
                        }`}
                    >
                        All Specialties
                    </button>
                    {specialties.map((spec) => (
                        <button
                            key={spec.name}
                            onClick={() => { setSelectedSpecialty(spec.name); setShowFilters(false); }}
                            className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 ${
                                selectedSpecialty === spec.name 
                                    ? `bg-${spec.color}-50 text-${spec.color}-700 font-medium` 
                                    : "hover:bg-gray-50 text-gray-700"
                            }`}
                        >
                            <spec.icon className={`w-4 h-4 text-${spec.color}-500`} />
                            {spec.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    const isFormValid =
        selectedDoctor &&
        form.patientName &&
        form.patientPhone &&
        form.patientAge &&
        form.patientGender &&
        form.appointmentDate &&
        form.appointmentTime &&
        form.consultationFee;

    const handleBooking = async () => {
        if (!isFormValid) {
            setToast({ type: "error", message: "Please fill all required fields" });
            return;
        }
        try {
            setBookingLoading(true);
            await userService.bookAppointment({
                doctorId: selectedDoctor?._id,
                ...form,
            });
            setToast({ type: "success", message: `Appointment booked with Dr. ${selectedDoctor?.name}` });
            setBookingModal(false);
            setForm({
                patientName: "",
                patientPhone: "",
                patientAge: "",
                patientGender: "",
                appointmentDate: "",
                appointmentTime: "",
                consultationFee: "",
                symptoms: "",
                notes: "",
            });
        } catch (err: any) {
            setToast({ type: "error", message: err?.message || "Booking failed" });
        } finally {
            setBookingLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile Menu Button */}
            <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden fixed bottom-4 right-4 z-50 p-3 bg-emerald-600 text-white rounded-full shadow-lg"
            >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Mobile Navigation Menu */}
            <Transition show={mobileMenuOpen} as={Fragment}>
                <Dialog onClose={() => setMobileMenuOpen(false)} className="relative z-50 lg:hidden">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/50" />
                    </Transition.Child>

                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 translate-y-full"
                        enterTo="opacity-100 translate-y-0"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 translate-y-full"
                    >
                        <Dialog.Panel className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4">
                            <div className="flex items-center justify-between mb-4">
                                <span className="font-semibold text-gray-900">Menu</span>
                                <button onClick={() => setMobileMenuOpen(false)}>
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            <nav className="space-y-2">
                                {[
                                    { icon: Stethoscope, label: "Doctors", tab: "doctors" },
                                    { icon: ClipboardList, label: "Orders", tab: "orders" }
                                ].map((item) => (
                                    <button
                                        key={item.label}
                                        onClick={() => {
                                            setActiveTab(item.tab as any);
                                            setMobileMenuOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-all"
                                    >
                                        <item.icon className="w-5 h-5 text-gray-600" />
                                        <span className="font-medium text-gray-700">{item.label}</span>
                                    </button>
                                ))}
                            </nav>
                        </Dialog.Panel>
                    </Transition.Child>
                </Dialog>
            </Transition>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                {/* Header Section */}
                <div className="mb-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-linear-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-sm">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wider text-emerald-600">
                                        Reception Desk
                                    </p>
                                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                                        Welcome back, {user?.name?.split(' ')[0] || "Receptionist"}
                                    </h1>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {new Date().toLocaleDateString('en-US', { 
                                            weekday: 'long', 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        })}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <TimeRangeSelector />
                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                    <UserCircle className="w-5 h-5 text-gray-600" />
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6">
                            <StatCard 
                                title="Doctors" 
                                value={stats.totalDoctors} 
                                icon={Stethoscope} 
                                color="emerald" 
                                trend={8}
                            />
                            <StatCard 
                                title="Orders" 
                                value={stats.totalOrders} 
                                icon={ClipboardList} 
                                color="blue" 
                                trend={24}
                            />
                            <StatCard 
                                title="Today" 
                                value={stats.todayOrders} 
                                icon={Calendar} 
                                color="purple" 
                            />
                            <StatCard 
                                title="Revenue" 
                                value={formatAmount(stats.totalRevenue)} 
                                icon={TrendingUp} 
                                color="green" 
                            />
                            <StatCard 
                                title="Pending" 
                                value={stats.pendingOrders} 
                                icon={Clock} 
                                color="rose" 
                            />
                        </div>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <p className="text-sm font-medium text-rose-700">{error}</p>
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
                    {[
                        { id: "doctors", label: "Doctors", icon: Stethoscope, color: "emerald" },
                        { id: "orders", label: "Orders", icon: ClipboardList, color: "blue" }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                                activeTab === tab.id
                                    ? `bg-${tab.color}-500 text-white shadow-sm`
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span className="text-sm">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content Sections */}
                {activeTab === "doctors" && (
                    <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        {/* Header with Search and Filter */}
                        <div className="p-4 border-b border-gray-100">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Doctors Directory
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        Book appointments with specialist doctors
                                    </p>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="relative w-full sm:w-56">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            value={doctorSearch}
                                            onChange={(e) => setDoctorSearch(e.target.value)}
                                            placeholder="Search doctors..."
                                            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <SpecialtyFilter />
                                </div>
                            </div>
                        </div>

                        {/* Doctors Grid */}
                        <div className="p-4">
                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : filteredDoctors.length === 0 ? (
                                <div className="text-center py-12">
                                    <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 font-medium">No doctors found</p>
                                    <button 
                                        onClick={() => { setDoctorSearch(""); setSelectedSpecialty("all"); }}
                                        className="mt-2 text-sm text-emerald-600 hover:text-emerald-700"
                                    >
                                        Clear filters
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {filteredDoctors.map((doc) => {
                                        const docId = doc._id || doc.id || doc.identifier || "";
                                        const specialty = doc.specialty || "General";
                                        const specialtyData = specialties.find(s => s.name === specialty) || specialties[6];
                                        const IconComponent = specialtyData.icon;
                                        
                                        return (
                                            <div 
                                                key={docId || doc.name} 
                                                className="group bg-gray-50 rounded-lg p-4 hover:bg-emerald-50/50 transition-colors border border-transparent hover:border-emerald-100"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="relative shrink-0">
                                                        <div className="w-12 h-12 rounded-lg bg-linear-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center font-semibold text-lg shadow-sm">
                                                            {doc.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-${specialtyData.color}-500 border-2 border-white flex items-center justify-center`}>
                                                            <IconComponent className="w-2 h-2 text-white" />
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div>
                                                                <h3 className="font-medium text-gray-900">
                                                                    Dr. {doc.name}
                                                                </h3>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <span className={`text-xs px-2 py-0.5 rounded-full bg-${specialtyData.color}-50 text-${specialtyData.color}-700`}>
                                                                        {specialty}
                                                                    </span>
                                                                    <div className="flex items-center gap-0.5">
                                                                        <Star className="w-3 h-3 text-amber-400 fill-current" />
                                                                        <span className="text-xs text-gray-600">4.8</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${doc.available ? 'bg-emerald-500' : 'bg-gray-300'} mt-1.5`} />
                                                        </div>
                                                        
                                                        <div className="mt-2 space-y-1">
                                                            {doc.email && (
                                                                <p className="text-xs text-gray-600 flex items-center gap-1.5">
                                                                    <Mail className="w-3 h-3 text-gray-400" />
                                                                    <span className="truncate">{doc.email}</span>
                                                                </p>
                                                            )}
                                                            {doc.phone && (
                                                                <p className="text-xs text-gray-600 flex items-center gap-1.5">
                                                                    <Phone className="w-3 h-3 text-gray-400" />
                                                                    {doc.phone}
                                                                </p>
                                                            )}
                                                        </div>
                                                        
                                                        <button
                                                            className="mt-3 w-full bg-white hover:bg-emerald-600 text-emerald-600 hover:text-white text-sm font-medium px-3 py-1.5 rounded-lg border border-emerald-200 hover:border-emerald-600 transition-all"
                                                            onClick={() => { setSelectedDoctor(doc); setBookingModal(true); }}
                                                        >
                                                            Book Appointment
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {activeTab === "orders" && (
                    <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Order Management
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        Track and manage all medicine orders
                                    </p>
                                </div>
                                
                                <div className="flex gap-2">
                                    <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                                        <Download className="w-4 h-4 text-gray-600" />
                                    </button>
                                    
                                    <div className="relative w-full sm:w-56">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            value={orderSearch}
                                            onChange={(e) => setOrderSearch(e.target.value)}
                                            placeholder="Search orders..."
                                            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {orderMeta?.fallback && (
                            <div className="mx-4 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                <p className="text-sm font-medium text-amber-700">
                                    Showing limited order data. {orderMeta.errorMessage && `(${orderMeta.errorMessage})`}
                                </p>
                            </div>
                        )}

                        <div className="p-4">
                            {orderError && (
                                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                    <p className="text-sm font-medium text-amber-700">{orderError}</p>
                                </div>
                            )}

                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : filteredOrders.length === 0 ? (
                                <div className="text-center py-12">
                                    <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 font-medium">No orders found</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredOrders.map((order) => {
                                        const statusColors = getStatusColor(order.orderStatus || "default");
                                        const StatusIcon = statusColors.icon;
                                        
                                        return (
                                            <div 
                                                key={order.orderId} 
                                                className="p-4 bg-gray-50 rounded-lg hover:bg-blue-50/50 transition-colors"
                                            >
                                                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                                                    <div className="flex-1">
                                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                                            <span className="font-mono font-medium text-gray-900">
                                                                #{order.orderId}
                                                            </span>
                                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors.lightBg} ${statusColors.text} flex items-center gap-1`}>
                                                                <StatusIcon className="w-3 h-3" />
                                                                {order.orderStatus}
                                                            </span>
                                                            <span className="px-2 py-0.5 bg-gray-200 rounded-full text-xs font-medium text-gray-700">
                                                                {order.paymentStatus}
                                                            </span>
                                                        </div>
                                                        
                                                        <p className="text-sm text-gray-700 mb-2">
                                                            {order.medicine?.name || "Medicine order"}
                                                        </p>
                                                        
                                                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                {new Date(order.createdAt).toLocaleDateString()}
                                                            </span>
                                                            <span className="font-medium text-gray-900">
                                                                {formatAmount(order.payableAmount)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2">
                                                        <button className="p-1.5 bg-white rounded-lg hover:bg-gray-100 transition-colors">
                                                            <MoreVertical className="w-4 h-4 text-gray-600" />
                                                        </button>
                                                        
                                                        <Link
                                                            href={`/orders/${order.orderId}`}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                                        >
                                                            View
                                                            <ChevronRight className="w-3 h-3" />
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </section>
                )}
            </div>

            {/* Booking Modal */}
            <Transition appear show={bookingModal} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setBookingModal(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/50" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-3">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white p-5 shadow-xl">
                                    <div className="flex items-center justify-between mb-4">
                                        <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                                            Book Appointment
                                        </Dialog.Title>
                                        <button
                                            onClick={() => setBookingModal(false)}
                                            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <X className="w-4 h-4 text-gray-500" />
                                        </button>
                                    </div>

                                    <div className="mb-4 p-3 bg-emerald-50 rounded-lg">
                                        <p className="text-sm font-medium text-gray-600">Selected Doctor</p>
                                        <p className="text-base font-semibold text-emerald-700">Dr. {selectedDoctor?.name}</p>
                                    </div>

                                    <form className="space-y-3" onSubmit={e => { e.preventDefault(); handleBooking(); }}>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <input 
                                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" 
                                                placeholder="Patient Name *" 
                                                value={form.patientName} 
                                                onChange={e => setForm({ ...form, patientName: e.target.value })} 
                                            />
                                            <input 
                                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" 
                                                placeholder="Phone Number *" 
                                                value={form.patientPhone} 
                                                onChange={e => setForm({ ...form, patientPhone: e.target.value })} 
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <input 
                                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" 
                                                placeholder="Age *" 
                                                type="number"
                                                value={form.patientAge} 
                                                onChange={e => setForm({ ...form, patientAge: e.target.value })} 
                                            />
                                            <div className="flex gap-2">
                                                {['Male', 'Female'].map(g => (
                                                    <button 
                                                        type="button" 
                                                        key={g} 
                                                        className={`flex-1 px-2 py-2 text-xs border rounded-lg font-medium transition-colors ${
                                                            form.patientGender === g 
                                                                ? 'bg-emerald-500 text-white border-emerald-500' 
                                                                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                                                        }`} 
                                                        onClick={() => setForm({ ...form, patientGender: g })}
                                                    >
                                                        {g}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <input 
                                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" 
                                                type="date" 
                                                value={form.appointmentDate} 
                                                onChange={e => setForm({ ...form, appointmentDate: e.target.value })} 
                                            />
                                            <input 
                                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" 
                                                type="time" 
                                                value={form.appointmentTime} 
                                                onChange={e => setForm({ ...form, appointmentTime: e.target.value })} 
                                            />
                                        </div>

                                        <input 
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" 
                                            placeholder="Consultation Fee *" 
                                            type="number"
                                            value={form.consultationFee} 
                                            onChange={e => setForm({ ...form, consultationFee: e.target.value })} 
                                        />

                                        <textarea 
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" 
                                            placeholder="Symptoms (optional)" 
                                            rows={2}
                                            value={form.symptoms} 
                                            onChange={e => setForm({ ...form, symptoms: e.target.value })} 
                                        />

                                        <div className="flex gap-2 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setBookingModal(false)}
                                                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                type="submit" 
                                                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
                                                    !isFormValid || bookingLoading 
                                                        ? 'bg-gray-400 cursor-not-allowed' 
                                                        : 'bg-emerald-600 hover:bg-emerald-700'
                                                }`} 
                                                disabled={!isFormValid || bookingLoading}
                                            >
                                                {bookingLoading ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                        Booking...
                                                    </div>
                                                ) : 'Confirm Booking'}
                                            </button>
                                        </div>
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Toast Notification */}
            <Transition
                show={toast !== null}
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-2"
                enterTo="opacity-100 translate-y-0"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-2"
            >
                <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-lg shadow-lg text-white font-medium z-50 flex items-center gap-2 ${
                    toast?.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
                }`}>
                    {toast?.type === 'error' ? 
                        <AlertCircle className="w-4 h-4" /> : 
                        <CheckCircle className="w-4 h-4" />
                    }
                    <span className="text-sm">{toast?.message}</span>
                </div>
            </Transition>
        </div>
    );
}