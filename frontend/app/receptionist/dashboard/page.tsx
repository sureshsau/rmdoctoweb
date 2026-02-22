"use client";

import { useEffect, useMemo, useState, Fragment, useCallback } from "react";
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
    Mail,
    Heart,
    RefreshCw,
    Plus,
    FileText,
    CreditCard,
    Video,
    MessageSquare,
    X,
    Filter,
    MoreVertical,
    ChevronDown,
    Users,
    Star,
    Menu
} from "lucide-react";
import { useAuthContext } from "@/state/AuthContext";
import { receptionistService } from "@/services/receptionist.service";
import { orderService, OrderOverview } from "@/services/order.service";
import { receptionistAppointmentService, Appointment, GetAppointmentsResponse } from "@/services/receptionist.appointment.service";
import { AuthUser } from "@/services/auth.service";
import { Dialog, Transition } from "@headlessui/react";

// Types
type TabType = "doctors" | "appointments" | "orders";
type TimeRangeType = "today" | "week" | "month";
type AppointmentFilterType = "today" | "month" | "custom";

// Constants
const ITEMS_PER_PAGE = 10;

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
        confirmed: { bg: "bg-blue-500", text: "text-blue-700", icon: CheckCircle, lightBg: "bg-blue-50" },
        processing: { bg: "bg-blue-500", text: "text-blue-700", icon: Activity, lightBg: "bg-blue-50" },
        delivered: { bg: "bg-teal-500", text: "text-teal-700", icon: CheckCircle, lightBg: "bg-teal-50" },
        shipped: { bg: "bg-indigo-500", text: "text-indigo-700", icon: TrendingUp, lightBg: "bg-indigo-50" },
        default: { bg: "bg-gray-500", text: "text-gray-700", icon: Clock, lightBg: "bg-gray-50" }
    };
    return statusMap[status.toLowerCase()] || statusMap.default;
};

// Appointment Card Component
const AppointmentCard = ({ appointment, onRefresh }: { appointment: Appointment; onRefresh?: () => void }) => {
    const [showDetails, setShowDetails] = useState(false);
    const doctorName = typeof appointment.doctorId === "object" 
        ? appointment.doctorId?.name 
        : "Doctor";

    // const handleStatusUpdate = async (status: string) => {
    //     try {
    //         await receptionistAppointmentService.updateAppointmentStatus(appointment._id, status);
    //         if (onRefresh) onRefresh();
    //     } catch (error) {
    //         console.error("Failed to update status:", error);
    //     }
    // };

    return (
        <div className="bg-white rounded-lg border border-gray-200 hover:border-emerald-200 transition-all">
            <div className="p-4">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <UserCircle className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <h4 className="font-semibold text-gray-900 truncate">
                                    {appointment.patientName}
                                </h4>
                                <p className="text-sm text-gray-600">
                                    Dr. {doctorName}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                                    {new Date(appointment.appointmentDate).toLocaleDateString()} {appointment.appointmentTime}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-xs text-gray-600 mt-3">
                            <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-gray-400" />
                                {appointment.patientPhone}
                            </div>
                            <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-gray-400" />
                                {new Date(appointment.appointmentDate).toLocaleDateString()} {appointment.appointmentTime}
                            </div>
                            <div className="flex items-center gap-1">
                                <UserCircle className="w-3 h-3 text-gray-400" />
                                {appointment.patientGender} • {appointment.patientAge}yrs
                            </div>
                            <div className="flex items-center gap-1 font-medium text-gray-900">
                                <CreditCard className="w-3 h-3 text-gray-400" />
                                ₹{appointment.consultationFee}
                            </div>
                        </div>

                        {showDetails && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                {appointment.symptoms && (
                                    <div className="mb-2">
                                        <p className="text-xs font-semibold text-gray-700 mb-1">Symptoms</p>
                                        <p className="text-xs text-gray-600">{appointment.symptoms}</p>
                                    </div>
                                )}
                                {appointment.notes && (
                                    <div>
                                        <p className="text-xs font-semibold text-gray-700 mb-1">Notes</p>
                                        <p className="text-xs text-gray-600">{appointment.notes}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, trend, color = "emerald", subtitle }: any) => (
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
                {subtitle && (
                    <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
                )}
            </div>
            <div className={`p-2.5 rounded-lg bg-${color}-50 text-${color}-600`}>
                <Icon className="w-5 h-5" />
            </div>
        </div>
    </div>
);

// Time Range Selector Component
const TimeRangeSelector = ({ selected, onChange }: { selected: TimeRangeType; onChange: (range: TimeRangeType) => void }) => (
    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
        {["today", "week", "month"].map((range) => (
            <button
                key={range}
                onClick={() => onChange(range as TimeRangeType)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    selected === range
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                }`}
            >
                {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
        ))}
    </div>
);

export default function ReceptionistDashboard() {
    const { user } = useAuthContext();
    
    // State
    const [doctors, setDoctors] = useState<AuthUser[]>([]);
    const [orders, setOrders] = useState<OrderOverview[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    
    // Loading states
    const [loading, setLoading] = useState(true);
    const [appointmentLoading, setAppointmentLoading] = useState(false);
    const [appointmentLoadingMore, setAppointmentLoadingMore] = useState(false);
    
    // Error states
    const [error, setError] = useState<string | null>(null);
    const [appointmentError, setAppointmentError] = useState<string | null>(null);
    const [orderError, setOrderError] = useState<string | null>(null);
    
    // Meta data
    const [orderMeta, setOrderMeta] = useState<{ fallback?: boolean; errorMessage?: string } | null>(null);
    const [appointmentPagination, setAppointmentPagination] = useState<{ page: number; totalPages: number; totalRecords?: number } | null>(null);
    
    // Pagination
    const [appointmentPage, setAppointmentPage] = useState(1);
    const [appointmentTotalPages, setAppointmentTotalPages] = useState(1);
    
    // Filters
    const [doctorSearch, setDoctorSearch] = useState("");
    const [orderSearch, setOrderSearch] = useState("");
    const [appointmentSearch, setAppointmentSearch] = useState("");
    const [activeTab, setActiveTab] = useState<TabType>("doctors");
    const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRangeType>("week");
    const [appointmentFilter, setAppointmentFilter] = useState<AppointmentFilterType>("today");
    
    // UI states
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    // Booking modal
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
    
    // Toast notification
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

    // Fetch appointments - FIXED VERSION
    const fetchAppointments = useCallback(async (page: number = 1, filterType: string = "today") => {
        try {
            if (page === 1) {
                setAppointmentLoading(true);
            } else {
                setAppointmentLoadingMore(true);
            }
            
            // FIX: Use 'type' parameter (matches backend), not 'filter'
            const response = await receptionistAppointmentService.getAppointments({
                page,
                limit: ITEMS_PER_PAGE,
                type: filterType,  // ✅ Correct parameter name
            });
            
            // FIX: Response structure matches GetAppointmentsResponse
            if (response?.success) {
                if (page === 1) {
                    setAppointments(response.data || []);
                } else {
                    setAppointments(prev => [...prev, ...(response.data || [])]);
                }
                
                // FIX: Use pagination object
                if (response.pagination) {
                    setAppointmentPagination(response.pagination);
                    setAppointmentTotalPages(response.pagination.totalPages || 1);
                }
                
                setAppointmentError(null);
            } else {
                setAppointmentError("Failed to load appointments");
            }
        } catch (err) {
            console.error("Failed to fetch appointments:", err);
            setAppointmentError("Failed to load appointments");
        } finally {
            setAppointmentLoading(false);
            setAppointmentLoadingMore(false);
        }
    }, []);

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);

            try {
                const [doctorRes, orderRes] = await Promise.allSettled([
                    receptionistService.getAllDoctors(),
                    orderService.getAllOrders()
                ]);

                // Handle doctors response
                if (doctorRes.status === "fulfilled" && doctorRes.value?.success) {
                    setDoctors(doctorRes.value.data || []);
                }

                // Handle orders response
                if (orderRes.status === "fulfilled") {
                    if (orderRes.value?.success) {
                        setOrders(orderRes.value.data || []);
                        setOrderError(null);
                    } else {
                        setOrderError(orderRes.value?.meta?.errorMessage || "Orders permission required");
                    }
                    setOrderMeta(orderRes.value?.meta ?? null);
                } else {
                    setOrderError("Failed to load orders");
                }

                // Load initial appointments
                await fetchAppointments(1, "today");
                
            } catch (err) {
                console.error("Failed to load receptionist dashboard", err);
                setError("Failed to load dashboard data");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [fetchAppointments]);

    // Refresh appointments when filter changes
    useEffect(() => {
        setAppointmentPage(1);
        fetchAppointments(1, appointmentFilter);
    }, [appointmentFilter, fetchAppointments]);

    // Filter appointments on frontend (since search isn't in API)
    const filteredAppointments = useMemo(() => {
        let filtered = appointments;
        
        // Apply search filter on frontend
        if (appointmentSearch.trim()) {
            const q = appointmentSearch.toLowerCase();
            filtered = filtered.filter((a) =>
                a.patientName.toLowerCase().includes(q) ||
                a.patientPhone.includes(q) ||
                (typeof a.doctorId === "object" && a.doctorId?.name?.toLowerCase().includes(q))
            );
        }
        
        return filtered;
    }, [appointments, appointmentSearch]);

    // Filter doctors
    const filteredDoctors = useMemo(() => {
        if (!doctorSearch.trim()) return doctors;
        const q = doctorSearch.toLowerCase();
        return doctors.filter((u) =>
            u.name.toLowerCase().includes(q) ||
            (u.phone || "").includes(q) ||
            (u.email || "").toLowerCase().includes(q) ||
            (u.specialty || "").toLowerCase().includes(q)
        );
    }, [doctors, doctorSearch]);

    // Filter orders
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

    // Calculate stats
    const stats = useMemo(() => {
        const now = new Date();
        const today = now.toDateString();

        const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
        const totalRevenue = orders.reduce((sum, o) => sum + (o.payableAmount || 0), 0);
        const pendingOrders = orders.filter(o => o.orderStatus?.toLowerCase() === 'pending').length;

        const availableDoctors = doctors.filter(d => d.available).length;
        const todayAppointments = appointments.filter(a => 
            new Date(a.appointmentDate).toDateString() === today
        ).length;

        return {
            totalDoctors: doctors.length,
            availableDoctors,
            totalOrders: orders.length,
            todayOrders: todayOrders.length,
            totalRevenue,
            todayRevenue: todayOrders.reduce((sum, o) => sum + (o.payableAmount || 0), 0),
            pendingOrders,
            todayAppointments,
        };
    }, [doctors, orders, appointments]);

    // Form validation
    const isFormValid = useMemo(() => {
        return selectedDoctor &&
            form.patientName &&
            form.patientPhone &&
            form.patientAge &&
            form.patientGender &&
            form.appointmentDate &&
            form.appointmentTime &&
            form.consultationFee;
    }, [selectedDoctor, form]);

    // Handle booking
    const handleBooking = async () => {
        if (!isFormValid) {
            setToast({ type: "error", message: "Please fill all required fields" });
            return;
        }
        
        try {
            setBookingLoading(true);
            
            const response = await receptionistService.bookAppointment({
                doctorId: String(selectedDoctor?._id || selectedDoctor?.id || ""),
                patientName: form.patientName,
                patientPhone: form.patientPhone,
                patientAge: form.patientAge,
                patientGender: form.patientGender.toUpperCase(),
                appointmentDate: form.appointmentDate,
                appointmentTime: form.appointmentTime,
                consultationFee: form.consultationFee,
                symptoms: form.symptoms || "",
                notes: form.notes || "",
            });
            
            if (response?.success) {
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
                
                // Refresh appointments
                fetchAppointments(1, appointmentFilter);
            } else {
                setToast({ type: "error", message: response?.message || "Booking failed" });
            }
        } catch (err: any) {
            setToast({ type: "error", message: err?.message || "Booking failed" });
        } finally {
            setBookingLoading(false);
        }
    };

    // Load more appointments
    const handleLoadMore = async () => {
        if (appointmentPage < appointmentTotalPages) {
            const nextPage = appointmentPage + 1;
            setAppointmentPage(nextPage);
            await fetchAppointments(nextPage, appointmentFilter);
        }
    };

    // Refresh data
    const handleRefresh = async () => {
        setLoading(true);
        try {
            const [doctorRes] = await Promise.all([
                receptionistService.getAllDoctors(),
                fetchAppointments(1, appointmentFilter)
            ]);
            
            if (doctorRes?.success) {
                setDoctors(doctorRes.data || []);
            }
            
            setToast({ type: "success", message: "Data refreshed successfully" });
        } catch (err) {
            console.error("Refresh failed:", err);
            setToast({ type: "error", message: "Failed to refresh data" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile Menu Button */}
            <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden fixed bottom-4 right-4 z-50 p-3 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-colors"
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
                                <button onClick={() => setMobileMenuOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            <nav className="space-y-2">
                                {[
                                    { icon: Stethoscope, label: "Doctors", tab: "doctors" as TabType },
                                    { icon: ClipboardList, label: "Appointments", tab: "appointments" as TabType },
                                    { icon: Pill, label: "Orders", tab: "orders" as TabType }
                                ].map((item) => (
                                    <button
                                        key={item.label}
                                        onClick={() => {
                                            setActiveTab(item.tab);
                                            setMobileMenuOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                            activeTab === item.tab
                                                ? "bg-emerald-50 text-emerald-700"
                                                : "hover:bg-gray-50 text-gray-700"
                                        }`}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        <span className="font-medium">{item.label}</span>
                                    </button>
                                ))}
                                <button
                                    onClick={handleRefresh}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 transition-all"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                    <span className="font-medium">Refresh</span>
                                </button>
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
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-sm">
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
                                {/* <TimeRangeSelector 
                                    selected={selectedTimeRange} 
                                    onChange={setSelectedTimeRange} 
                                /> */}
                                <button
                                    onClick={handleRefresh}
                                    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                    title="Refresh data"
                                >
                                    <RefreshCw className="w-4 h-4 text-gray-600" />
                                </button>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
                            <StatCard 
                                title="Doctors" 
                                value={stats.totalDoctors} 
                                icon={Stethoscope} 
                                color="emerald"                
                            />
                            <StatCard 
                                title="Appointments" 
                                value={stats.todayAppointments} 
                                icon={Calendar} 
                                color="blue" 
                                
                            />
                            <StatCard 
                                title="Orders" 
                                value={stats.totalOrders} 
                                icon={ClipboardList} 
                                color="purple" 
                                
                            />
                            <StatCard 
                                title="Today's Orders" 
                                value={stats.todayOrders} 
                                icon={Activity} 
                                color="amber" 
                            />
                            <StatCard 
                                title="Revenue" 
                                value={formatAmount(stats.totalRevenue)} 
                                icon={TrendingUp} 
                                color="green" 
                                // subtitle={formatAmount(stats.todayRevenue)}
                            />
                    
                        </div>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        <p className="text-sm font-medium text-rose-700">{error}</p>
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
                    {[
                        { id: "doctors" as TabType, label: "Doctors", icon: Stethoscope, color: "emerald" },
                        { id: "appointments" as TabType, label: "Appointments", icon: Calendar, color: "blue" },
                        { id: "orders" as TabType, label: "Orders", icon: ClipboardList, color: "purple" }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
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

                {/* Doctors Tab */}
                {activeTab === "doctors" && (
                    <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        {/* Header with Search */}
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
                                
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        value={doctorSearch}
                                        onChange={(e) => setDoctorSearch(e.target.value)}
                                        placeholder="Search doctors..."
                                        className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
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
                                        onClick={() => setDoctorSearch("")}
                                        className="mt-2 text-sm text-emerald-600 hover:text-emerald-700"
                                    >
                                        Clear search
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {filteredDoctors.map((doc) => {
                                        const docId = doc._id || doc.id || "";
                                        const specialty = doc.specialty || "General Medicine";
                                        
                                        return (
                                            <div 
                                                key={docId || doc.name} 
                                                className="group bg-gray-50 rounded-lg p-4 hover:bg-emerald-50/50 transition-colors border border-transparent hover:border-emerald-100"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="relative flex-shrink-0">
                                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center font-semibold text-lg shadow-sm">
                                                            {doc.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div>
                                                                <h3 className="font-medium text-gray-900">
                                                                    Dr. {doc.name}
                                                                </h3>
                                                            </div>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${doc.available ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'} mt-1.5`} />
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

                {/* Appointments Tab */}
                {activeTab === "appointments" && (
                    <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Appointments
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        View and manage all patient appointments
                                    </p>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                                        {["today", "month"].map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => setAppointmentFilter(type as AppointmentFilterType)}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                                                    appointmentFilter === type
                                                        ? "bg-white text-gray-900 shadow-sm"
                                                        : "text-gray-600 hover:text-gray-900"
                                                }`}
                                            >
                                                {type.charAt(0).toUpperCase() + type.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                    
                                    <div className="relative w-full sm:w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            value={appointmentSearch}
                                            onChange={(e) => setAppointmentSearch(e.target.value)}
                                            placeholder="Search patient / doctor..."
                                            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4">
                            {appointmentError && (
                                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                    <p className="text-sm font-medium text-amber-700">{appointmentError}</p>
                                </div>
                            )}
                            
                            {appointmentLoading && appointments.length === 0 ? (
                                <div className="flex justify-center py-12">
                                    <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : filteredAppointments.length === 0 ? (
                                <div className="text-center py-12">
                                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 font-medium">No appointments found</p>
                                    <button
                                        onClick={() => {
                                            setAppointmentFilter("today");
                                            setAppointmentSearch("");
                                        }}
                                        className="mt-2 text-sm text-emerald-600 hover:text-emerald-700"
                                    >
                                        Clear filters
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-3">
                                        {filteredAppointments.map((appointment) => (
                                            <AppointmentCard 
                                                key={appointment._id} 
                                                appointment={appointment}
                                                onRefresh={() => fetchAppointments(1, appointmentFilter)}
                                            />
                                        ))}
                                    </div>
                                    
                                    {appointmentLoadingMore && (
                                        <div className="flex justify-center py-4">
                                            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
                                    
                                    {appointmentPage < appointmentTotalPages && !appointmentLoadingMore && (
                                        <div className="flex justify-center mt-4">
                                            <button
                                                onClick={handleLoadMore}
                                                className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                                            >
                                                Load More
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </section>
                )}

                {/* Orders Tab */}
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

                        {orderMeta?.fallback && (
                            <div className="mx-4 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                <p className="text-sm font-medium text-amber-700">
                                    Showing limited order data. {orderMeta.errorMessage && `(${orderMeta.errorMessage})`}
                                </p>
                            </div>
                        )}

                        <div className="p-4">
                            {orderError && (
                                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
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
                                                className="p-4 bg-gray-50 rounded-lg hover:bg-blue-50/50 transition-colors border border-transparent hover:border-blue-200"
                                            >
                                                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                                                    {/* Order image */}
                                                    {order.medicine?.image ? (
                                                        <img
                                                            src={order.medicine.image}
                                                            alt={order.medicine.name || 'Medicine'}
                                                            className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                                                        />
                                                    ) : (
                                                        <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400">
                                                            <Pill className="w-8 h-8" />
                                                        </div>
                                                    )}
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
                                                        <Link
                                                            href={`/receptionist/orders/${order.orderId}`}
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
                                                {['MALE', 'FEMALE', 'OTHER'].map((g) => (
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
                                                        {g.charAt(0) + g.slice(1).toLowerCase()}
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

                                        <textarea 
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" 
                                            placeholder="Additional Notes (optional)" 
                                            rows={2}
                                            value={form.notes} 
                                            onChange={e => setForm({ ...form, notes: e.target.value })} 
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