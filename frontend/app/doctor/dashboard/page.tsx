"use client";
import { useEffect, useMemo, useState } from "react";
import { doctorAppointmentService } from "@/services/doctor.appointment.service";
import { AuthUser } from "@/services/auth.service";
import { Appointment } from "@/services/receptionist.appointment.service";
import { 
  Calendar, 
  Search, 
  Clock, 
  Phone, 
  IndianRupee,
  RefreshCw,
  User,
  Activity,
  Filter,
  ChevronDown,
  Loader2,
  MoreVertical,
  Eye,
  FileText,
  Download,
  XCircle
} from "lucide-react";
// import { useAuthContext } from "@/state/AuthContext"; // Uncomment if available

const LIMIT = 10;

// Dummy user for demonstration; replace with real auth context
// const dummyUser: AuthUser = { id: "DOCTOR_ID", name: "Dr. John Doe"};

// Enhanced filter options
const FILTER_OPTIONS = [
  { value: "today", label: "Today", icon: Clock, color: "from-blue-500 to-cyan-500" },
  { value: "week", label: "This Week", icon: Calendar, color: "from-purple-500 to-pink-500" },
];

export default function DoctorDashboard() {
  // Replace with: const { user } = useAuthContext();
//   const user = dummyUser;
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [filterType, setFilterType] = useState("today");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  const fetchAppointments = async (page = 1, isRefresh = false) => {
    try {
      if (page === 1) setLoading(true);
      setError(null);
      const res = await doctorAppointmentService.getAppointments({
        page,
        filterType,
        limit: LIMIT,
      });
      const newData = res.data || [];
      if (page === 1 || isRefresh) {
        setAppointments(newData);
      } else {
        setAppointments((prev) => [...prev, ...newData]);
      }
      setPagination({
        page,
        totalPages: res.pagination?.totalPages || 1,
      });
    } catch (err: any) {
      setError("Failed to load appointments");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchAppointments(1, true);
  }, [filterType]);

  const filteredAppointments = useMemo(() => {
    if (!search.trim()) return appointments;
    const keyword = search.toLowerCase();
    return appointments.filter(
      (a) =>
        a.patientName?.toLowerCase().includes(keyword) ||
        a.patientPhone?.includes(search)
    );
  }, [appointments, search]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments(1, true);
  };

  const loadMore = async () => {
    if (pagination.page >= pagination.totalPages || loadingMore) return;
    setLoadingMore(true);
    await fetchAppointments(pagination.page + 1);
  };

  const getCurrentFilter = () => {
    return FILTER_OPTIONS.find(f => f.value === filterType) || FILTER_OPTIONS[0];
  };

  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
      return time;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return { text: 'Today', color: 'text-emerald-600' };
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return { text: 'Tomorrow', color: 'text-blue-600' };
    } else if (date.toDateString() === yesterday.toDateString()) {
      return { text: 'Yesterday', color: 'text-amber-600' };
    } else {
      return { 
        text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        color: 'text-slate-600'
      };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Simple Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-slate-800">Dashboard</h1>
            </div>
            
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="p-2.5 bg-white border border-slate-200 rounded-xl hover:border-cyan-200 hover:bg-cyan-50/50 transition-all duration-200 disabled:opacity-50 shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 text-slate-600 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters and Search */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-lg shadow-slate-200/20 p-4 sm:p-5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Mobile Filter Dropdown */}
            <div className="sm:hidden relative">
              <button
                onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700"
              >
                <span className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-cyan-500" />
                  <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent font-semibold">
                    {getCurrentFilter().label}
                  </span>
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${filterDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {filterDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setFilterDropdownOpen(false)} />
                  <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    {FILTER_OPTIONS.map((filter) => {
                      const Icon = filter.icon;
                      return (
                        <button
                          key={filter.value}
                          onClick={() => {
                            setFilterType(filter.value);
                            setFilterDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm transition-all ${
                            filterType === filter.value
                              ? `bg-gradient-to-r ${filter.color} text-white`
                              : "text-slate-600 hover:bg-slate-50"
                          } first:rounded-t-xl last:rounded-b-xl`}
                        >
                          <Icon className="w-4 h-4" />
                          {filter.label}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Desktop Filter Buttons */}
            <div className="hidden sm:flex items-center gap-2">
              {FILTER_OPTIONS.map((filter) => {
                const Icon = filter.icon;
                const isActive = filterType === filter.value;
                return (
                  <button
                    key={filter.value}
                    onClick={() => setFilterType(filter.value)}
                    className={`group relative px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden ${
                      isActive
                        ? `bg-gradient-to-r ${filter.color} text-white shadow-lg shadow-${filter.color.split('-')[1]}-500/25`
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span className={`absolute inset-0 bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'hidden' : ''}`} />
                    <span className="relative flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
                      {filter.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Bar */}
            <div className="flex-1 relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
              <input
                type="text"
                placeholder="Search by patient name or phone number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 focus:bg-white transition-all duration-200"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <XCircle className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Appointments Grid/List */}
        <div className="space-y-4">
          {loading && appointments.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 p-12">
              <div className="flex flex-col items-center justify-center">
                <div className="relative">
                  <Loader2 className="w-12 h-12 text-cyan-600 animate-spin" />
                  <div className="absolute inset-0 animate-ping">
                    <div className="w-12 h-12 rounded-full bg-cyan-400/20"></div>
                  </div>
                </div>
                <p className="text-sm text-slate-500 mt-4">Loading appointments...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-rose-200 p-12">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-100 flex items-center justify-center">
                  <Activity className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-1">Unable to load appointments</h3>
                <p className="text-sm text-slate-500 mb-4">{error}</p>
                <button
                  onClick={onRefresh}
                  className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-medium text-sm shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/30 transition-all duration-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 p-12">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-1">No appointments found</h3>
                <p className="text-sm text-slate-500 mb-4">
                  {search ? "Try adjusting your search terms" : "No appointments scheduled for this period"}
                </p>
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-medium text-sm shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/30 transition-all duration-200"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Appointments List */}
              <div className="grid grid-cols-1 gap-4">
                {filteredAppointments.map((appt, index) => {
                  const dateInfo = formatDate(appt.appointmentDate);
                  const statusColors = {
                    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                    pending: 'bg-amber-100 text-amber-700 border-amber-200',
                    cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
                  };
                //   const status = appt.status || 'pending';
                  
                  return (
                    <div
                      key={appt._id}
                      className="group bg-white hover:bg-gradient-to-br hover:from-white hover:to-slate-50 rounded-xl sm:rounded-2xl border border-slate-200 hover:border-cyan-200 shadow-sm hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-300 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          {/* Left Section - Patient Info */}
                          <div className="flex items-start gap-4">
                            <div className="relative">
                              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-cyan-500/20">
                                {appt.patientName?.charAt(0).toUpperCase()}
                              </div>
                              {/* <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                                status === 'completed' ? 'bg-emerald-500' :
                                status === 'cancelled' ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'
                              }`} /> */}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h3 className="text-base sm:text-lg font-bold text-slate-800">
                                  {appt.patientName}
                                </h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[status as keyof typeof statusColors]}`}>
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </span>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-3 text-sm">
                                <span className="flex items-center gap-1.5 text-slate-600">
                                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                                  {appt.patientPhone}
                                </span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full hidden sm:block" />
                                <span className={`flex items-center gap-1.5 font-medium ${dateInfo.color}`}>
                                  <Calendar className="w-3.5 h-3.5" />
                                  {dateInfo.text}
                                </span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full hidden sm:block" />
                                <span className="flex items-center gap-1.5 text-slate-600">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  {formatTime(appt.appointmentTime)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right Section - Fee & Actions */}
                          <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 ml-16 sm:ml-0">
                            <div className="text-right">
                              <div className="text-xs text-slate-500 mb-0.5">Fee</div>
                              <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                                ₹{appt.consultationFee}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Status Indicator Bar */}
                      {status === 'completed' && (
                        <div className="h-1 bg-gradient-to-r from-emerald-500 to-green-500" style={{ width: '100%' }} />
                      )}
                      {status === 'pending' && (
                        <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500 animate-pulse" style={{ width: '100%' }} />
                      )}
                      {status === 'cancelled' && (
                        <div className="h-1 bg-gradient-to-r from-rose-500 to-pink-500" style={{ width: '100%' }} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Load More */}
              {pagination.page < pagination.totalPages && (
                <div className="flex justify-center pt-4">
                  {loadingMore ? (
                    <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                      <Loader2 className="w-5 h-5 text-cyan-600 animate-spin" />
                      <span className="text-sm text-slate-600">Loading more...</span>
                    </div>
                  ) : (
                    <button
                      onClick={loadMore}
                      className="group relative px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-medium text-sm shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/30 transition-all duration-200 overflow-hidden"
                    >
                      <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                      <span className="relative flex items-center gap-2">
                        Load More
                        <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                      </span>
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {filteredAppointments.length > 0 && (
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-400">
              Showing {filteredAppointments.length} of {pagination.totalPages * LIMIT} appointments
            </p>
          </div>
        )}
      </div>
    </div>
  );
}