'use client';

import React, { useState } from 'react';
import { Plus, Minus, Filter, Download, DollarSign, TrendingUp, TrendingDown, Wallet, CreditCard, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';
import { Card, StatCard } from '@/components/admin/Card';
import { Table, Pagination } from '@/components/admin/Table';
import { Input, Select } from '@/components/admin/Input';
import { Button } from '@/components/admin/Button';
import { Badge } from '@/components/admin/Badge';
import { Modal, ModalHeader, ModalFooter } from '@/components/admin/Modal';

// Utility functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatTime = (date: string) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Mock data
const transactionData = [
  {
    id: 'TXN001',
    type: 'credit',
    amount: 5000,
    description: 'Initial wallet setup',
    date: '2025-11-29T09:00:00Z',
    reference: 'INIT-001',
    status: 'completed',
  },
  {
    id: 'TXN002',
    type: 'debit',
    amount: 500,
    description: 'Employee bonus payment',
    date: '2025-11-28T14:30:00Z',
    reference: 'BONUS-EMP001',
    status: 'completed',
  },
  {
    id: 'TXN003',
    type: 'credit',
    amount: 2500,
    description: 'Monthly revenue addition',
    date: '2025-11-27T16:45:00Z',
    reference: 'REV-2025-11',
    status: 'completed',
  },
  {
    id: 'TXN004',
    type: 'debit',
    amount: 300,
    description: 'Office supplies purchase',
    date: '2025-11-26T11:15:00Z',
    reference: 'SUP-001',
    status: 'completed',
  },
  {
    id: 'TXN005',
    type: 'debit',
    amount: 750,
    description: 'Marketing campaign payment',
    date: '2025-11-25T13:20:00Z',
    reference: 'MKT-001',
    status: 'completed',
  },
  {
    id: 'TXN006',
    type: 'credit',
    amount: 1200,
    description: 'Client payment received',
    date: '2025-11-24T10:00:00Z',
    reference: 'CLIENT-PAY-001',
    status: 'completed',
  },
  {
    id: 'TXN007',
    type: 'debit',
    amount: 450,
    description: 'Utility bill payment',
    date: '2025-11-23T15:30:00Z',
    reference: 'UTIL-001',
    status: 'pending',
  },
];

const filterOptions = [
  { value: 'all', label: 'All Transactions' },
  { value: 'credit', label: 'Credits' },
  { value: 'debit', label: 'Debits' },
];

const timeFilterOptions = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
];

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
  reference: string;
  status: 'completed' | 'pending' | 'failed';
}

export default function WalletPage() {
  const [transactions, setTransactions] = useState(transactionData);
  const [typeFilter, setTypeFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false);
  const [isDeductFundsModalOpen, setIsDeductFundsModalOpen] = useState(false);
  const [fundForm, setFundForm] = useState({
    amount: '',
    description: '',
    reference: '',
  });

  const itemsPerPage = 10;

  // Calculate current balance
  const currentBalance = transactions
    .filter(t => t.status === 'completed')
    .reduce((balance, transaction) => {
      return transaction.type === 'credit' 
        ? balance + transaction.amount 
        : balance - transaction.amount;
    }, 0);

  // Filter data
  const filteredData = transactions.filter((item) => {
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    return matchesType;
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate stats
  const totalCredits = transactions
    .filter(t => t.type === 'credit' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalDebits = transactions
    .filter(t => t.type === 'debit' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingTransactions = transactions.filter(t => t.status === 'pending').length;

  const handleAddFunds = () => {
    const newTransaction: Transaction = {
      id: `TXN${String(transactions.length + 1).padStart(3, '0')}`,
      type: 'credit',
      amount: parseFloat(fundForm.amount),
      description: fundForm.description,
      date: new Date().toISOString(),
      reference: fundForm.reference || `ADD-${Date.now()}`,
      status: 'completed',
    };
    
    setTransactions([newTransaction, ...transactions]);
    setIsAddFundsModalOpen(false);
    resetFundForm();
  };

  const handleDeductFunds = () => {
    const newTransaction: Transaction = {
      id: `TXN${String(transactions.length + 1).padStart(3, '0')}`,
      type: 'debit',
      amount: parseFloat(fundForm.amount),
      description: fundForm.description,
      date: new Date().toISOString(),
      reference: fundForm.reference || `DED-${Date.now()}`,
      status: 'completed',
    };
    
    setTransactions([newTransaction, ...transactions]);
    setIsDeductFundsModalOpen(false);
    resetFundForm();
  };

  const resetFundForm = () => {
    setFundForm({
      amount: '',
      description: '',
      reference: '',
    });
  };

  const handleExportCSV = () => {
    const headers = ['Transaction ID', 'Type', 'Amount', 'Description', 'Date', 'Reference', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => [
        row.id,
        row.type,
        row.amount,
        row.description,
        row.date,
        row.reference,
        row.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const transactionColumns = [
    {
      key: 'id',
      header: 'Transaction ID',
      className: 'font-medium',
    },
    {
      key: 'type',
      header: 'Type',
      render: (value: string) => (
        <Badge variant={value === 'credit' ? 'success' : 'danger'}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (value: number, row: Transaction) => (
        <span className={`font-medium ${row.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
          {row.type === 'credit' ? '+' : '-'}{formatCurrency(value)}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
    },
    {
      key: 'date',
      header: 'Date & Time',
      render: (value: string) => (
        <div>
          <div className="font-medium">{formatDate(value)}</div>
          <div className="text-sm text-gray-500">{formatTime(value)}</div>
        </div>
      ),
    },
    {
      key: 'reference',
      header: 'Reference',
      className: 'font-mono text-sm',
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: string) => (
        <Badge variant={
          value === 'completed' ? 'success' : 
          value === 'pending' ? 'warning' : 
          'danger'
        }>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Badge>
      ),
    },
  ];

  const FundForm = ({ 
    onSubmit, 
    submitLabel, 
    type 
  }: { 
    onSubmit: () => void; 
    submitLabel: string;
    type: 'add' | 'deduct';
  }) => (
    <div className="space-y-4">
      <Input
        label="Amount"
        type="number"
        value={fundForm.amount}
        onChange={(e) => setFundForm({ ...fundForm, amount: e.target.value })}
        placeholder="0.00"
        required
      />
      
      <Input
        label="Description"
        value={fundForm.description}
        onChange={(e) => setFundForm({ ...fundForm, description: e.target.value })}
        placeholder={`Reason for ${type === 'add' ? 'adding' : 'deducting'} funds`}
        required
      />
      
      <Input
        label="Reference (Optional)"
        value={fundForm.reference}
        onChange={(e) => setFundForm({ ...fundForm, reference: e.target.value })}
        placeholder="Custom reference number"
      />

      <ModalFooter>
        <Button
          variant="outline"
          onClick={() => {
            setIsAddFundsModalOpen(false);
            setIsDeductFundsModalOpen(false);
            resetFundForm();
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={onSubmit}
          variant={type === 'add' ? 'primary' : 'danger'}
        >
          {submitLabel}
        </Button>
      </ModalFooter>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wallet Management</h1>
          <p className="text-gray-600">Manage organization funds and transaction history</p>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={() => setIsAddFundsModalOpen(true)}
            className="flex items-center gap-2"
            variant="primary"
          >
            <Plus className="h-4 w-4" />
            Add Funds
          </Button>
          <Button
            onClick={() => setIsDeductFundsModalOpen(true)}
            className="flex items-center gap-2"
            variant="danger"
          >
            <Minus className="h-4 w-4" />
            Deduct Funds
          </Button>
        </div>
      </div>

      {/* Balance & Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Current Balance"
          value={formatCurrency(currentBalance)}
          change="Available funds"
          changeType="neutral"
          icon={<DollarSign className="h-6 w-6 text-blue-600" />}
        />
        
        <StatCard
          title="Total Credits"
          value={formatCurrency(totalCredits)}
          change="+12% this month"
          changeType="positive"
          icon={<TrendingUp className="h-6 w-6 text-green-600" />}
        />
        
        <StatCard
          title="Total Debits"
          value={formatCurrency(totalDebits)}
          change="-5% from last month"
          changeType="negative"
          icon={<TrendingDown className="h-6 w-6 text-red-600" />}
        />
        
        <Card className="text-center">
          <div className="text-2xl font-bold text-orange-600">{pendingTransactions}</div>
          <div className="text-sm text-gray-600 font-medium">Pending Transactions</div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            <Select
              label="Transaction Type"
              options={filterOptions}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            />
            
            <Select
              label="Time Period"
              options={timeFilterOptions}
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
            />
          </div>
          
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </Card>

      {/* Transaction History */}
      <Card 
        title="Transaction History" 
        subtitle={`Showing ${paginatedData.length} of ${filteredData.length} transactions`}
      >
        <Table
          columns={transactionColumns}
          data={paginatedData}
          emptyMessage="No transactions found"
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

      {/* Add Funds Modal */}
      <Modal
        isOpen={isAddFundsModalOpen}
        onClose={() => setIsAddFundsModalOpen(false)}
        title="Add Funds to Wallet"
        size="md"
      >
        <FundForm 
          onSubmit={handleAddFunds} 
          submitLabel="Add Funds" 
          type="add"
        />
      </Modal>

      {/* Deduct Funds Modal */}
      <Modal
        isOpen={isDeductFundsModalOpen}
        onClose={() => setIsDeductFundsModalOpen(false)}
        title="Deduct Funds from Wallet"
        size="md"
      >
        <FundForm 
          onSubmit={handleDeductFunds} 
          submitLabel="Deduct Funds" 
          type="deduct"
        />
      </Modal>
      </div>
    </div>
  );
}