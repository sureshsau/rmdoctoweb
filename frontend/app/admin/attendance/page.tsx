'use client';

import React, { useState, Fragment } from 'react';
import { Search, Download, Calendar, Clock, Users, TrendingUp, UserCheck2, X, Flag, Sunrise, Sunset } from 'lucide-react';
import { Card } from '@/components/admin/Card';
import { Table, Pagination } from '@/components/admin/Table';
import { Input, Select } from '@/components/admin/Input';
import { Button } from '@/components/admin/Button';
import { Badge } from '@/components/admin/Badge';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import FaceRegister from '@/components/admin/FaceRegister';
import AttendanceSettingsModal from '@/components/admin/AttendendanceSettings';

// Mock data
const attendanceData = [
  {
    id: 'EMP001',
    name: 'John Doe',
    checkIn: '09:15 AM',
    checkOut: '06:30 PM',
    status: 'Present',
    workHours: '8h 15m',
    date: '2025-11-29',
    department: 'Engineering',
  },
  {
    id: 'EMP002',
    name: 'Jane Smith',
    checkIn: '08:45 AM',
    checkOut: '05:45 PM',
    status: 'Present',
    workHours: '9h 00m',
    date: '2025-11-29',
    department: 'Marketing',
  },
  {
    id: 'EMP003',
    name: 'Mike Johnson',
    checkIn: '09:45 AM',
    checkOut: '06:00 PM',
    status: 'Late',
    workHours: '8h 15m',
    date: '2025-11-29',
    department: 'Sales',
  },
  {
    id: 'EMP004',
    name: 'Sarah Wilson',
    checkIn: '-',
    checkOut: '-',
    status: 'Absent',
    workHours: '-',
    date: '2025-11-29',
    department: 'HR',
  },
  {
    id: 'EMP005',
    name: 'David Brown',
    checkIn: '08:30 AM',
    checkOut: '05:30 PM',
    status: 'Present',
    workHours: '9h 00m',
    date: '2025-11-29',
    department: 'Finance',
  },
  {
    id: 'EMP006',
    name: 'Lisa Anderson',
    checkIn: '09:00 AM',
    checkOut: '06:15 PM',
    status: 'Present',
    workHours: '8h 15m',
    date: '2025-11-29',
    department: 'Engineering',
  },
  {
    id: 'EMP007',
    name: 'Tom Wilson',
    checkIn: '10:15 AM',
    checkOut: '07:00 PM',
    status: 'Late',
    workHours: '8h 45m',
    date: '2025-11-29',
    department: 'Marketing',
  },
  {
    id: 'EMP008',
    name: 'Emma Davis',
    checkIn: '08:50 AM',
    checkOut: '05:50 PM',
    status: 'Present',
    workHours: '9h 00m',
    date: '2025-11-29',
    department: 'Sales',
  },
];

const filterOptions = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
];

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
];

const attendanceColumns = [
  {
    key: 'employee',
    header: 'Employee',
    render: (value: string, row: any) => (
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-linear-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {row.name.split(' ').map((n: string) => n[0]).join('')}
        </div>
        <div>
          <div className="font-semibold text-gray-900">{row.name}</div>
          <div className="text-sm text-gray-500">{row.id} • {row.department}</div>
        </div>
      </div>
    ),
  },
  {
    key: 'checkIn',
    header: 'Check-in',
    render: (value: string) => (
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-green-500" />
        <span className="font-medium text-gray-700">{value}</span>
      </div>
    ),
  },
  {
    key: 'checkOut',
    header: 'Check-out',
    render: (value: string) => (
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-orange-500" />
        <span className="font-medium text-gray-700">{value}</span>
      </div>
    ),
  },
  {
    key: 'workHours',
    header: 'Work Hours',
    render: (value: string) => (
      <div className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-sm font-medium">
        {value}
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

export default function AttendancePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('today');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isDateActionModalOpen, setIsDateActionModalOpen] = useState(false);
  const [showRegisterFace, setShowRegisterFace] = useState(false);
const [showAttendanceSettings, setShowAttendanceSettings] = useState(false);

  const itemsPerPage = 10;

  // Filter data based on search and filters
  const filteredData = attendanceData.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExportCSV = () => {
    const headers = ['Employee ID', 'Name', 'Check In', 'Check Out', 'Work Hours', 'Status', 'Department'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => [
        row.id,
        row.name,
        row.checkIn,
        row.checkOut,
        row.workHours,
        row.status,
        row.department
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setIsCalendarOpen(false);
    setIsDateActionModalOpen(true);
  };

  const handleDateAction = (action: 'holiday' | 'half-day' | 'day-off') => {
    if (selectedDate) {
      console.log(`Marking ${format(selectedDate, 'PPP')} as a ${action}.`);
      // Here you would typically make an API call to save this information
      alert(`Date ${format(selectedDate, 'PPP')} marked as ${action}.`);
    }
    setIsDateActionModalOpen(false);
  };

  const presentCount = filteredData.filter(item => item.status === 'Present').length;
  const lateCount = filteredData.filter(item => item.status === 'Late').length;
  const absentCount = filteredData.filter(item => item.status === 'Absent').length;
  const attendanceRate = filteredData.length > 0 ? Math.round((presentCount / filteredData.length) * 100) : 0;

  return (
    <>
    <div className="min-h-full bg-linear-to-br from-gray-50 to-gray-100/50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Simple Modern Header */}
     <div className="flex items-center gap-3">
  <Button
    onClick={() => setShowRegisterFace(true)}
    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
  >
    Register Face
  </Button>

  <Button
    onClick={() => setShowAttendanceSettings(true)}
    variant="outline"
    className="px-4 py-2 rounded-lg"
  >
    Attendance Settings
  </Button>

  <Button
    variant="outline"
    onClick={() => setIsCalendarOpen(true)}
    className="flex items-center gap-2 px-4 py-2 border-gray-200 hover:bg-gray-50 rounded-lg"
  >
    <Calendar className="h-4 w-4" /> 
    Date Range
  </Button>

  <Button 
    onClick={handleExportCSV} 
    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
  >
    <Download className="h-4 w-4" />
    Export CSV
  </Button>
</div>


        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {[
            { 
              label: 'Present Today', 
              value: presentCount, 
              icon: <UserCheck2 className="h-6 w-6" />, 
              color: 'from-green-500 to-emerald-500',
              bg: 'bg-green-50',
              textColor: 'text-green-700'
            },
            { 
              label: 'Late Arrivals', 
              value: lateCount, 
              icon: <Clock className="h-6 w-6" />, 
              color: 'from-amber-500 to-orange-500',
              bg: 'bg-amber-50',
              textColor: 'text-amber-700'
            },
            { 
              label: 'Absent Today', 
              value: absentCount, 
              icon: <Users className="h-6 w-6" />, 
              color: 'from-red-500 to-rose-500',
              bg: 'bg-red-50',
              textColor: 'text-red-700'
            },
            { 
              label: 'Attendance Rate', 
              value: `${attendanceRate}%`, 
              icon: <TrendingUp className="h-6 w-6" />, 
              color: 'from-blue-500 to-indigo-500',
              bg: 'bg-blue-50',
              textColor: 'text-blue-700'
            }
          ].map((stat, index) => (
            <div key={index} className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stat.bg} ${stat.textColor}`}>
                    {stat.label.includes('Rate') ? 'Overall' : 'Today'}
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.textColor} group-hover:scale-110 transition-transform duration-300`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Search by name or employee ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-5 w-5 text-gray-400" />}
                className="w-full"
              />
            </div>
            
            <Select
              options={filterOptions}
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
            />
            
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Today's Attendance</h3>
              <p className="text-gray-600 text-sm">
                Showing {paginatedData.length} of {filteredData.length} attendance records
              </p>
            </div>
          </div>
          
          <div className="overflow-hidden">
            <Table
              columns={attendanceColumns}
              data={paginatedData}
              emptyMessage="No attendance records found for the selected filters"
            />
          </div>
          
          {totalPages > 1 && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Calendar Modal */}
      {isCalendarOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 relative max-w-min">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Select a Date</h3>
            <button onClick={() => setIsCalendarOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
              <X className="h-6 w-6" />
            </button>
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              onDayClick={handleDayClick}
              className="p-0"
              classNames={{
                head_cell: 'text-gray-500 font-medium text-sm',
                cell: 'h-10 w-10 text-sm',
                day_selected: 'bg-cyan-600 text-white hover:bg-cyan-700',
                day_today: 'font-bold text-cyan-600',
              }}
            />
          </div>
        </div>
      )}

      {/* Date Action Modal */}
      {isDateActionModalOpen && selectedDate && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 relative w-full max-w-md">
            <button onClick={() => setIsDateActionModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
              <X className="h-6 w-6" />
            </button>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900">Mark Date</h3>
              <p className="text-gray-600 mt-2">
                You have selected <span className="font-semibold text-cyan-600">{format(selectedDate, 'PPP')}</span>.
              </p>
              <p className="text-sm text-gray-500 mt-1">How would you like to mark this day for the organization?</p>
            </div>

            <div className="mt-8 space-y-4">
              <button
                onClick={() => handleDateAction('holiday')}
                className="w-full flex items-center justify-center gap-3 text-left p-4 border rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors duration-200"
              >
                <div className="p-2 bg-red-100 rounded-full">
                  <Flag className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Mark as Holiday</p>
                  <p className="text-sm text-gray-500">Declare this day as a public holiday.</p>
                </div>
              </button>
              <button
                onClick={() => handleDateAction('half-day')}
                className="w-full flex items-center justify-center gap-3 text-left p-4 border rounded-lg hover:bg-amber-50 hover:border-amber-200 transition-colors duration-200"
              >
                <div className="p-2 bg-amber-100 rounded-full">
                  <Sunrise className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Mark as Half Day</p>
                  <p className="text-sm text-gray-500">Set this day as a half working day.</p>
                </div>
              </button>
              <button
                onClick={() => handleDateAction('day-off')}
                className="w-full flex items-center justify-center gap-3 text-left p-4 border rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-colors duration-200"
              >
                <div className="p-2 bg-gray-200 rounded-full">
                  <Sunset className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Mark as Day Off</p>
                  <p className="text-sm text-gray-500">Give everyone a compensatory day off.</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Face Register Modal */}
{showRegisterFace && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="relative w-full max-w-6xl">
      
      {/* Close Button */}
      <button
        onClick={() => setShowRegisterFace(false)}
        className="absolute -top-4 -right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100">
        <X className="h-5 w-5 text-gray-700" />
      </button>

      {/* Face Register Component */}
      <FaceRegister />
    </div>
  </div>
)}

{showAttendanceSettings && (
  <AttendanceSettingsModal onClose={() => setShowAttendanceSettings(false)} />
)}
    </div>
    </>
  );
}