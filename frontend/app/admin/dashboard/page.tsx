'use client';

import React, {useState} from 'react';
import { Users, UserCheck, DollarSign, Clock, TrendingUp, TrendingDown, Activity, BarChart3, PieChart, Search,Calendar, Bell, Check, X } from 'lucide-react';
import { Card, StatCard } from '@/components/admin/Card';
import { Table } from '@/components/admin/Table';
import { Badge } from '@/components/admin/Badge';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Mock data
const statsData = [
  {
    title: 'Total Employees',
    value: 248,
    change: '+12% from last month',
    changeType: 'positive' as const,
    icon: <Users className="h-6 w-6 text-blue-600" />,
    bgColor: 'bg-blue-50',
  },
  {
    title: 'Total Agents',
    value: 42,
    change: '+3% from last month',
    changeType: 'positive' as const,
    icon: <UserCheck className="h-6 w-6 text-emerald-600" />,
    bgColor: 'bg-emerald-50',
  },
  {
    title: 'Present Today',
    value: 215,
    change: '-2% from yesterday',
    changeType: 'negative' as const,
    icon: <Activity className="h-6 w-6 text-amber-600" />,
    bgColor: 'bg-amber-50',
  },
  {
    title: 'Wallet Balance',
    value: '$45,250',
    change: '+8% from last week',
    changeType: 'positive' as const,
    icon: <DollarSign className="h-6 w-6 text-violet-600" />,
    bgColor: 'bg-violet-50',
  },
];

// Chart data for monthly attendance overview
const attendanceChartData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  datasets: [
    {
      label: 'Present',
      data: [210, 215, 220, 225, 218, 230, 235, 240, 228, 232, 238, 215],
      borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      fill: true,
      tension: 0.4,
    },
    {
      label: 'Absent',
      data: [38, 33, 28, 23, 30, 18, 13, 8, 20, 16, 10, 33],
      borderColor: 'rgb(239, 68, 68)',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      fill: true,
      tension: 0.4,
    },
    {
      label: 'Late',
      data: [15, 18, 12, 20, 16, 14, 18, 22, 19, 15, 12, 20],
      borderColor: 'rgb(245, 158, 11)',
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      fill: true,
      tension: 0.4,
    },
  ],
};

const attendanceChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          size: 12,
          weight: 500,
        },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: 'white',
      bodyColor: 'white',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        font: {
          size: 11,
        },
      },
    },
    y: {
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
      },
      ticks: {
        font: {
          size: 11,
        },
      },
    },
  },
  interaction: {
    intersect: false,
    mode: 'index' as const,
  },
  elements: {
    point: {
      radius: 4,
      hoverRadius: 8,
    },
  },
};

// Department distribution chart
const departmentChartData = {
  labels: ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance'],
  datasets: [
    {
      data: [45, 32, 28, 15, 22],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(251, 146, 60, 0.8)',
        'rgba(99, 102, 241, 0.8)',
      ],
      borderColor: [
        'rgba(59, 130, 246, 1)',
        'rgba(168, 85, 247, 1)',
        'rgba(34, 197, 94, 1)',
        'rgba(251, 146, 60, 1)',
        'rgba(99, 102, 241, 1)',
      ],
      borderWidth: 2,
    },
  ],
};

const departmentChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        padding: 15,
        usePointStyle: true,
        font: {
          size: 11,
        },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: 'white',
      bodyColor: 'white',
      cornerRadius: 8,
    },
  },
  cutout: '60%',
};

const recentActivityData = [
  {
    id: 1,
    employee: 'John Doe',
    action: 'Checked In',
    time: '09:15 AM',
    status: 'Present',
    department: 'Engineering',
  },
  {
    id: 2,
    employee: 'Jane Smith',
    action: 'Checked Out',
    time: '06:30 PM',
    status: 'Present',
    department: 'Marketing',
  },
  {
    id: 3,
    employee: 'Mike Johnson',
    action: 'Late Check In',
    time: '09:45 AM',
    status: 'Late',
    department: 'Sales',
  },
  {
    id: 4,
    employee: 'Sarah Wilson',
    action: 'Absent',
    time: '-',
    status: 'Absent',
    department: 'HR',
  },
  {
    id: 5,
    employee: 'David Brown',
    action: 'Checked In',
    time: '08:30 AM',
    status: 'Present',
    department: 'Finance',
  },
];

const attendanceColumns = [
  {
    key: 'employee',
    header: 'Employee',
    render: (value: string, row: any) => (
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
          {value.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.department}</div>
        </div>
      </div>
    ),
  },
  {
    key: 'action',
    header: 'Action',
    render: (value: string) => (
      <span className="font-medium text-gray-700">{value}</span>
    ),
  },
  {
    key: 'time',
    header: 'Time',
    render: (value: string) => (
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-gray-400" />
        <span className="text-gray-600">{value}</span>
      </div>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (value: string) => (
      <Badge variant={
        value === 'Present' ? 'success' : 
        value === 'Late' ? 'warning' : 
        'danger'
      }>
        {value}
      </Badge>
    ),
  },
];

const accessRequestData = [
  {
    id: 'REQ001',
    name: 'Dr. Emily Carter',
    role: 'Doctor',
    request: 'Admin access for new research module.',
    time: '2 hours ago',
  },
  {
    id: 'REQ002',
    name: 'Michael Lee',
    role: 'Receptionist',
    request: 'Access to the updated billing system.',
    time: '8 hours ago',
  },
  {
    id: 'REQ003',
    name: 'Samantha Ray',
    role: 'Agent',
    request: 'Higher API rate limits for data sync.',
    time: '1 day ago',
  },
  {
    id: 'REQ004',
    name: 'Kevin Harris',
    role: 'Employee',
    request: 'Permission to view departmental reports.',
    time: '2 days ago',
  },
];





export default function DashboardPage() {
  
const [searchQuery, setSearchQuery] = useState("");
const [users, setUsers] = useState([
  { id: 1, name: "Mayur Laxkar", email: "mayur@gmail.com" },
  { id: 2, name: "Riya Sharma", email: "riya@gmail.com" },
  { id: 3, name: "Amit Verma", email: "amitv@example.com" },
]);

const filteredUsers = users.filter(
  (u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
);






// Role assignment 
const [isRoleDrawerOpen, setIsRoleDrawerOpen] = useState(false);
const [selectedUser, setSelectedUser] = useState<any>(null);
const [roles, setRoles] = useState<any[]>([]);
const [selectedRoleId, setSelectedRoleId] = useState<string>("");
const [loadingRoles, setLoadingRoles] = useState(false);

const onRoleAssign = async (user: any) => {
  setSelectedUser(user);
  setIsRoleDrawerOpen(true);
  setLoadingRoles(true);

  try {
    const res = await fetch("http://localhost:5000/roles", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status}`);
    }

    const data = await res.json();
    setRoles(data.roles || data);
  } catch (err) {
    console.error("❌ Failed to fetch roles:", err);
    alert("Backend is not reachable. Check server & CORS.");
  } finally {
    setLoadingRoles(false);
  }
};



const assignRoleToUser = async () => {
  if (!selectedRoleId || !selectedUser) return;

  try {
    const res = await fetch("http://localhost:5000/role-assignments/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: selectedUser.id,
        roleId: selectedRoleId,
      }),
    });

    const data = await res.json();
    console.log("Role assigned:", data);

    setIsRoleDrawerOpen(false);
    setSelectedRoleId("");
    setSelectedUser(null);
  } catch (err) {
    console.error("Assign failed", err);
  }
};





  return (
    <div className="min-h-full bg-linear-to-br from-gray-50 via-white to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Modern Header with better spacing */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
              <p className="text-gray-600">Overview of your hospital management system</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards with improved animations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsData.map((stat, index) => (
            <div 
              key={index}
              className="group bg-white/90 backdrop-blur-lg rounded-3xl p-6 border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-105"
              style={{
                animationDelay: `${index * 100}ms`,
                animation: 'fadeInUp 0.6s ease-out forwards'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-3">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
                  {stat.change && (
                    <div className="flex items-center gap-1">
                      {stat.changeType === 'positive' ? (
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <p className={`text-sm font-medium ${
                        stat.changeType === 'positive' 
                          ? 'text-emerald-600' 
                          : 'text-red-600'
                      }`}>
                        {stat.change}
                      </p>
                    </div>
                  )}
                </div>
                <div className={`p-4 rounded-2xl ${stat.bgColor} group-hover:scale-110 transition-all duration-300 shadow-lg`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid with proper spacing */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8 items-start">
          {/* Left Column: Main Charts and Requests */}
          <div className="xl:col-span-2">
            <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-6 border border-gray-200/50 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Monthly Attendance Overview</h3>
                  <p className="text-sm text-gray-600">Track employee attendance patterns</p>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-full">
                  <BarChart3 className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Analytics</span>
                </div>
              </div>
              <div className="h-80 relative">
                <Line data={attendanceChartData} options={attendanceChartOptions} />
              </div>
            </div>



            {/* Access Requests Notification Box */}
<div className="bg-white/90 backdrop-blur-lg rounded-3xl p-6 border border-gray-200/50 shadow-xl mt-8 min-h-[320px] flex flex-col">
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-4">
      <div className="p-3 bg-linear-to-br from-rose-500 to-rose-600 rounded-xl shadow-lg">
        <Bell className="h-6 w-6 text-white" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-gray-900">Role Allocation</h3>
      </div>
    </div>
  </div>

  {/* 🔍 Search Input */}
  <div className="relative mb-6">
    <input
      type="text"
      placeholder="Search user by name or email..."
      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pl-11 focus:ring-2 focus:ring-rose-500 focus:bg-white focus:border-rose-400 transition-all"
      onChange={(e) => setSearchQuery(e.target.value)}
    />
    <Search className="h-5 w-5 text-gray-500 absolute left-3 top-3.5" />
  </div>

  {/* User List */}
  <div className="space-y-4 overflow-y-auto pr-1" style={{ maxHeight: "260px" }}>
    {filteredUsers.length === 0 ? (
      <p className="text-gray-500 text-sm text-center mt-6">No users found</p>
    ) : (
      filteredUsers.map((user) => (
        <div
          key={user.id}
          className="p-4 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 flex items-center justify-between transition-all"
        >
          {/* Left: Name + Email */}
          <div>
            <p className="font-semibold text-gray-800">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>

          {/* Right: Role Button */}
          <button onClick={() => onRoleAssign(user)} className="px-4 py-2 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-all">
            Assign Role
          </button>
        </div>
      ))
    )}
  </div>
</div>

          </div>

          {/* Right Column: Sidebar Stats */}
          <div className="space-y-6">
            {/* Quick Stats Card */}
            <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-6 border border-gray-200/50 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
                  <PieChart className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Quick Stats</h3>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'On Time', value: '89%', color: 'text-emerald-600', bg: 'bg-emerald-100', percent: 89 },
                  { label: 'Late Arrivals', value: '8%', color: 'text-amber-600', bg: 'bg-amber-100', percent: 8 },
                  { label: 'Absent', value: '3%', color: 'text-red-600', bg: 'bg-red-100', percent: 3 },
                  { label: 'Average Hours', value: '8.2h', color: 'text-blue-600', bg: 'bg-blue-100', percent: 82 },
                ].map((stat, index) => (
                  <div key={index} className="group p-4 rounded-xl hover:bg-gray-50 transition-all duration-300 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 font-medium">{stat.label}</span>
                      <span className={`font-bold text-lg ${stat.color}`}>{stat.value}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-0 overflow-hidden">
                      <div 
                        className={`h-full ${stat.bg.replace('bg-', 'bg-linear-to-r from-')} transition-all duration-1000 ease-out`}
                        style={{ width: `${stat.percent}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Department Distribution Chart */}
            <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-6 border border-gray-200/50 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-linear-to-br from-violet-500 to-violet-600 rounded-xl shadow-lg shrink-0">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Department Overview</h3>
                  <p className="text-sm text-gray-600">Employee distribution across departments</p>
                </div>
              </div>
              <div className="h-64 relative mb-4">
                <Doughnut data={departmentChartData} options={departmentChartOptions} />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Recent Activity */}
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-8 border border-gray-200/50 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Recent Activity</h3>
              <p className="text-gray-600">Latest employee check-ins and check-outs</p>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-full">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <Activity className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Live updates</span>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-gray-200">
            <Table
              columns={attendanceColumns}
              data={recentActivityData}
              emptyMessage="No recent activity"
            />
          </div>
        </div>

      </div>

      {/* Add keyframe animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* ✅ Side Role Drawer */}
{isRoleDrawerOpen && (
  <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
    <div className="w-[400px] h-full bg-white shadow-2xl p-6 flex flex-col animate-slideIn">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Assign Role</h2>
        <button onClick={() => setIsRoleDrawerOpen(false)}>
          <X className="h-6 w-6 text-gray-500 hover:text-gray-800" />
        </button>
      </div>

      {/* Selected User */}
      <div className="mb-4 p-3 rounded-lg border bg-gray-50">
        <p className="font-semibold">{selectedUser?.name}</p>
        <p className="text-sm text-gray-600">{selectedUser?.email}</p>
      </div>

      {/* Role List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {loadingRoles ? (
          <p className="text-gray-500 text-sm">Loading roles...</p>
        ) : (
          roles.map((role) => (
            <label
              key={role._id}
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all
                ${selectedRoleId === role._id ? "border-rose-500 bg-rose-50" : "hover:bg-gray-50"}`}
            >
              <div>
                <p className="font-medium text-gray-800">{role.name}</p>
                <p className="text-xs text-gray-500">{role.description}</p>
              </div>
              <input
                type="radio"
                name="role"
                checked={selectedRoleId === role._id}
                onChange={() => setSelectedRoleId(role._id)}
              />
            </label>
          ))
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={assignRoleToUser}
        className="mt-6 w-full py-3 rounded-lg bg-rose-500 text-white font-semibold hover:bg-rose-600 transition-all"
      >
        Confirm Assignment
      </button>
    </div>
  </div>
)}

    </div>
  );
}