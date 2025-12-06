'use client';

import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, User, Filter, Users2, Mail, Phone, Building2 } from 'lucide-react';
import { Card } from '@/components/admin/Card';
import { Table, Pagination } from '@/components/admin/Table';
import { Input, Select } from '@/components/admin/Input';
import { Button } from '@/components/admin/Button';
import { Badge } from '@/components/admin/Badge';
import { Modal, ModalHeader, ModalFooter } from '@/components/admin/Modal';

// Mock data
const employeesData = [
  {
    id: 'EMP001',
    name: 'John Doe',
    email: 'john.doe@hospital.com',
    mobile: '+1 (555) 123-4567',
    role: 'Software Engineer',
    status: 'Active',
    department: 'Engineering',
    joinDate: '2023-01-15',
    photo: null as string | null,
  },
  {
    id: 'EMP002',
    name: 'Jane Smith',
    email: 'jane.smith@hospital.com',
    mobile: '+1 (555) 234-5678',
    role: 'Marketing Manager',
    status: 'Active',
    department: 'Marketing',
    joinDate: '2023-02-20',
    photo: null as string | null,
  },
  {
    id: 'EMP003',
    name: 'Mike Johnson',
    email: 'mike.johnson@hospital.com',
    mobile: '+1 (555) 345-6789',
    role: 'Sales Representative',
    status: 'Active',
    department: 'Sales',
    joinDate: '2023-03-10',
    photo: null as string | null,
  },
  {
    id: 'EMP004',
    name: 'Sarah Wilson',
    email: 'sarah.wilson@hospital.com',
    mobile: '+1 (555) 456-7890',
    role: 'HR Specialist',
    status: 'Inactive',
    department: 'HR',
    joinDate: '2023-01-05',
    photo: null as string | null,
  },
  {
    id: 'EMP005',
    name: 'David Brown',
    email: 'david.brown@hospital.com',
    mobile: '+1 (555) 567-8901',
    role: 'Financial Analyst',
    status: 'Active',
    department: 'Finance',
    joinDate: '2023-04-01',
    photo: null as string | null,
  },
];

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const roleOptions = [
  { value: '', label: 'Select Role' },
  { value: 'Software Engineer', label: 'Software Engineer' },
  { value: 'Marketing Manager', label: 'Marketing Manager' },
  { value: 'Sales Representative', label: 'Sales Representative' },
  { value: 'HR Specialist', label: 'HR Specialist' },
  { value: 'Financial Analyst', label: 'Financial Analyst' },
];

const statusOptionsForm = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
];

interface Employee {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  status: string;
  department: string;
  joinDate: string;
  photo: string | null;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState(employeesData);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    role: '',
    status: 'Active',
    department: '',
  });

  const itemsPerPage = 10;

  // Filter data
  const filteredData = employees.filter((item) => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  const handleAddEmployee = () => {
    const newEmployee: Employee = {
      id: `EMP${String(employees.length + 1).padStart(3, '0')}`,
      name: formData.name,
      email: formData.email,
      mobile: formData.mobile,
      role: formData.role,
      status: formData.status,
      department: formData.department,
      joinDate: new Date().toISOString().split('T')[0],
      photo: null,
    };
    
    setEmployees([...employees, newEmployee]);
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleEditEmployee = () => {
    if (!editingEmployee) return;
    
    const updatedEmployees = employees.map(emp => 
      emp.id === editingEmployee.id 
        ? { ...emp, ...formData }
        : emp
    );
    
    setEmployees(updatedEmployees);
    setIsEditModalOpen(false);
    setEditingEmployee(null);
    resetForm();
  };

  const handleDeleteEmployee = (employeeId: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      setEmployees(employees.filter(emp => emp.id !== employeeId));
    }
  };

  const openEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      mobile: employee.mobile,
      role: employee.role,
      status: employee.status,
      department: employee.department,
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      mobile: '',
      role: '',
      status: 'Active',
      department: '',
    });
  };

  const employeeColumns = [
    {
      key: 'photo',
      header: '',
      render: (value: string | null, row: Employee) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-linear-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {row.name.split(' ').map(n => n[0]).join('')}
          </div>
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Employee',
      render: (value: string, row: Employee) => (
        <div>
          <div className="font-semibold text-gray-900">{value}</div>
          <div className="text-sm text-gray-500 flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            {row.department}
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Contact',
      render: (value: string, row: Employee) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-3 w-3 text-gray-400" />
            <span className="text-gray-700">{value}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-3 w-3 text-gray-400" />
            <span className="text-gray-700">{row.mobile}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (value: string, row: Employee) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.id}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: string) => (
        <Badge variant={value === 'Active' ? 'success' : 'danger'}>
          {value}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (value: any, row: Employee) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => openEditModal(row)}
            className="p-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDeleteEmployee(row.id)}
            className="p-2"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const EmployeeForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Full Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="Enter full name"
        />
        <Input
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          placeholder="Enter email address"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Mobile Number"
          value={formData.mobile}
          onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
          required
          placeholder="Enter mobile number"
        />
        <Input
          label="Department"
          value={formData.department}
          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          required
          placeholder="Enter department"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select
          label="Job Role"
          options={roleOptions}
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
        />
        <Select
          label="Employment Status"
          options={statusOptionsForm}
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
        />
      </div>

      <ModalFooter>
        <Button
          variant="outline"
          onClick={() => {
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
            resetForm();
          }}
          className="px-6"
        >
          Cancel
        </Button>
        <Button onClick={onSubmit} className="px-6">
          {submitLabel}
        </Button>
      </ModalFooter>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Simple Modern Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Employees</h1>
            <p className="text-gray-600">Manage your organization's workforce</p>
          </div>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            Add Employee
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { 
              label: 'Total Employees', 
              value: employees.length, 
              icon: <Users2 className="h-5 w-5" />, 
              color: 'from-blue-500 to-blue-600',
              bg: 'bg-blue-50'
            },
            { 
              label: 'Active Employees', 
              value: employees.filter(e => e.status === 'Active').length, 
              icon: <User className="h-5 w-5" />, 
              color: 'from-green-500 to-green-600',
              bg: 'bg-green-50'
            },
            { 
              label: 'Departments', 
              value: new Set(employees.map(e => e.department)).size, 
              icon: <Building2 className="h-5 w-5" />, 
              color: 'from-purple-500 to-purple-600',
              bg: 'bg-purple-50'
            },
            { 
              label: 'This Month', 
              value: employees.filter(e => e.joinDate.includes('2023-11')).length, 
              icon: <Plus className="h-5 w-5" />, 
              color: 'from-orange-500 to-orange-600',
              bg: 'bg-orange-50'
            }
          ].map((stat, index) => (
            <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg} text-gray-700`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, email, or employee ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-5 w-5 text-gray-400" />}
                className="w-full"
              />
            </div>
            
            <div className="sm:w-64">
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Employee Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Employee Directory</h3>
              <p className="text-gray-600 text-sm">
                Showing {paginatedData.length} of {filteredData.length} employees
              </p>
            </div>
          </div>
          
          <div className="overflow-hidden">
            <Table
              columns={employeeColumns}
              data={paginatedData}
              emptyMessage="No employees found matching your search criteria"
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

        {/* Add Employee Modal */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Employee"
          size="lg"
        >
          <EmployeeForm onSubmit={handleAddEmployee} submitLabel="Add Employee" />
        </Modal>

        {/* Edit Employee Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Employee Information"
          size="lg"
        >
          <EmployeeForm onSubmit={handleEditEmployee} submitLabel="Update Employee" />
        </Modal>
      </div>
    </div>
  );
}