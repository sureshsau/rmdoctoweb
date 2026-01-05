'use client';

import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, User, ShieldCheck, TrendingUp, DollarSign, Star, Filter } from 'lucide-react';
import { Card } from '@/components/admin/Card';
import { Table, Pagination } from '@/components/admin/Table';
import { Input, Select } from '@/components/admin/Input';
import { Button } from '@/components/admin/Button';
import { Badge } from '@/components/admin/Badge';
import { Modal, ModalHeader, ModalFooter } from '@/components/admin/Modal';

// Mock data
const agentsData = [
  {
    id: 'AGT001',
    name: 'Robert Johnson',
    email: 'robert.johnson@hospital.com',
    mobile: '+1 (555) 111-2222',
    role: 'Senior Sales Agent',
    status: 'Active',
    department: 'Sales',
    joinDate: '2023-01-10',
    commission: '15%',
    totalSales: '$125,000',
    photo: null as string | null,
  },
  {
    id: 'AGT002',
    name: 'Emily Davis',
    email: 'emily.davis@hospital.com',
    mobile: '+1 (555) 222-3333',
    role: 'Marketing Agent',
    status: 'Active',
    department: 'Marketing',
    joinDate: '2023-02-15',
    commission: '12%',
    totalSales: '$98,500',
    photo: null as string | null,
  },
  {
    id: 'AGT003',
    name: 'Alex Thompson',
    email: 'alex.thompson@hospital.com',
    mobile: '+1 (555) 333-4444',
    role: 'Business Development Agent',
    status: 'Active',
    department: 'Business Development',
    joinDate: '2023-03-05',
    commission: '18%',
    totalSales: '$156,750',
    photo: null as string | null,
  },
  {
    id: 'AGT004',
    name: 'Maria Rodriguez',
    email: 'maria.rodriguez@hospital.com',
    mobile: '+1 (555) 444-5555',
    role: 'Customer Relations Agent',
    status: 'Inactive',
    department: 'Customer Service',
    joinDate: '2023-01-20',
    commission: '10%',
    totalSales: '$67,200',
    photo: null as string | null,
  },
  {
    id: 'AGT005',
    name: 'James Wilson',
    email: 'james.wilson@hospital.com',
    mobile: '+1 (555) 555-6666',
    role: 'Regional Agent',
    status: 'Active',
    department: 'Regional Sales',
    joinDate: '2023-04-10',
    commission: '20%',
    totalSales: '$198,300',
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
  { value: 'Senior Sales Agent', label: 'Senior Sales Agent' },
  { value: 'Marketing Agent', label: 'Marketing Agent' },
  { value: 'Business Development Agent', label: 'Business Development Agent' },
  { value: 'Customer Relations Agent', label: 'Customer Relations Agent' },
  { value: 'Regional Agent', label: 'Regional Agent' },
];

const statusOptionsForm = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
];

interface Agent {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  status: string;
  department: string;
  joinDate: string;
  commission: string;
  totalSales: string;
  photo: string | null;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState(agentsData);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    role: '',
    status: 'Active',
    department: '',
    commission: '',
  });

  const itemsPerPage = 10;

  // Filter data
  const filteredData = agents.filter((item) => {
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

  const handleAddAgent = () => {
    const newAgent: Agent = {
      id: `AGT${String(agents.length + 1).padStart(3, '0')}`,
      name: formData.name,
      email: formData.email,
      mobile: formData.mobile,
      role: formData.role,
      status: formData.status,
      department: formData.department,
      joinDate: new Date().toISOString().split('T')[0],
      commission: formData.commission,
      totalSales: '$0',
      photo: null,
    };
    
    setAgents([...agents, newAgent]);
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleEditAgent = () => {
    if (!editingAgent) return;
    
    const updatedAgents = agents.map(agent => 
      agent.id === editingAgent.id 
        ? { ...agent, ...formData }
        : agent
    );
    
    setAgents(updatedAgents);
    setIsEditModalOpen(false);
    setEditingAgent(null);
    resetForm();
  };

  const handleDeleteAgent = (agentId: string) => {
    if (window.confirm('Are you sure you want to delete this agent?')) {
      setAgents(agents.filter(agent => agent.id !== agentId));
    }
  };

  const openEditModal = (agent: Agent) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      email: agent.email,
      mobile: agent.mobile,
      role: agent.role,
      status: agent.status,
      department: agent.department,
      commission: agent.commission,
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
      commission: '',
    });
  };

  const agentColumns = [
    {
      key: 'photo',
      header: 'Photo',
      render: (value: string | null) => (
        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
          <User className="h-6 w-6 text-blue-600" />
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Agent Name',
      render: (value: string, row: Agent) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.id}</div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
    },
    {
      key: 'mobile',
      header: 'Mobile',
    },
    {
      key: 'role',
      header: 'Role',
      render: (value: string, row: Agent) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.department}</div>
        </div>
      ),
    },
    {
      key: 'commission',
      header: 'Commission',
      render: (value: string, row: Agent) => (
        <div>
          <div className="font-medium text-blue-600">{value}</div>
          <div className="text-sm text-gray-500">{row.totalSales}</div>
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
      render: (value: any, row: Agent) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => openEditModal(row)}
            className="p-2"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDeleteAgent(row.id)}
            className="p-2"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const AgentForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Full Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Mobile"
          value={formData.mobile}
          onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
          required
        />
        <Input
          label="Department"
          value={formData.department}
          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          required
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select
          label="Role"
          options={roleOptions}
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
        />
        <Input
          label="Commission (%)"
          value={formData.commission}
          onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
          placeholder="e.g., 15%"
          required
        />
        <Select
          label="Status"
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
        >
          Cancel
        </Button>
        <Button onClick={onSubmit}>
          {submitLabel}
        </Button>
      </ModalFooter>
    </div>
  );

  // Calculate stats
  const activeAgents = agents.filter(a => a.status === 'Active').length;
  const totalCommission = agents.reduce((sum, agent) => {
    const commissionRate = parseFloat(agent.commission.replace('%', '')) / 100;
    const sales = parseFloat(agent.totalSales.replace(/[$,]/g, ''));
    return sum + (sales * commissionRate);
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agent Employee Management</h1>
            <p className="text-gray-600">Manage your organization's agent employees and commissions</p>
          </div>
        
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add New Agent
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="text-2xl font-bold text-blue-600">{agents.length}</div>
          <div className="text-sm text-gray-600 font-medium">Total Agents</div>
        </Card>
        
        <Card className="text-center">
          <div className="text-2xl font-bold text-green-600">{activeAgents}</div>
          <div className="text-sm text-gray-600 font-medium">Active Agents</div>
        </Card>
        
        <Card className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            ${totalCommission.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 font-medium">Total Commission</div>
        </Card>
        
        <Card className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            ${agents.reduce((sum, agent) => sum + parseFloat(agent.totalSales.replace(/[$,]/g, '')), 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 font-medium">Total Sales</div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Search by name, email, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4 text-gray-400" />}
          />
          
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </Card>

      {/* Agent Table */}
      <Card 
        title="Agent List" 
        subtitle={`Showing ${paginatedData.length} of ${filteredData.length} agents`}
      >
        <Table
          columns={agentColumns}
          data={paginatedData}
          emptyMessage="No agents found"
        />
        
        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </Card>

      {/* Add Agent Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Agent"
        size="lg"
      >
        <AgentForm onSubmit={handleAddAgent} submitLabel="Add Agent" />
      </Modal>

      {/* Edit Agent Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Agent"
        size="lg"
      >
        <AgentForm onSubmit={handleEditAgent} submitLabel="Update Agent" />
      </Modal>
      </div>
    </div>
  );
}