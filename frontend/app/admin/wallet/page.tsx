"use client";

import React, { useEffect, useState } from "react";
import { walletService } from "@/services/wallet.service";
import { 
  Coins, 
  Loader2, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet,
  AlertCircle 
} from "lucide-react";

interface RMCoinsLog {
  _id: string;
  amount: number;
  fromUserId?: { _id: string; name: string } | string;
  toUserId?: { _id: string; name: string } | string;
  type: string;
  description: string;
  createdAt: string;
}

interface RMCoinsWallet {
  userId: string;
  name: string;
  balance: number;
  totalSent: number;
  totalReceived: number;
}

interface RMCoinsData {
  wallet: RMCoinsWallet;
  logs: RMCoinsLog[];
  pagination: {
    page: number;
    totalPages: number;
    totalRecords: number;
  };
}

export default function AdminWalletPage() {
  const [rmcoins, setRmcoins] = useState<RMCoinsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Recharge modal state
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [rechargeError, setRechargeError] = useState("");
  const [rechargeSuccess, setRechargeSuccess] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch RM Coins data
      console.log("Fetching RM Coins...");
      const coinsRes = await walletService.getAdminRMCoinsLogs();
      console.log("RM Coins response:", coinsRes);
      
      // Process RM Coins data
      if (coinsRes?.data) {
        // Handle different response structures
        const coinsData = coinsRes.data.data || coinsRes.data;
        
        setRmcoins({
          wallet: {
            userId: coinsData.wallet?.userId || '',
            name: coinsData.wallet?.name || 'Admin',
            balance: coinsData.wallet?.balance ?? coinsData.balance ?? 0,
            totalSent: coinsData.wallet?.totalSent ?? 0,
            totalReceived: coinsData.wallet?.totalReceived ?? 0
          },
          logs: Array.isArray(coinsData.logs) ? coinsData.logs : [],
          pagination: coinsData.pagination || {
            page: 1,
            totalPages: 1,
            totalRecords: 0
          }
        });
      }
      
    } catch (err: any) {
      console.error("Failed to fetch wallet data:", err);
      setError(err?.message || "Failed to load wallet data");
      
      // Set empty data on error
      setRmcoins({
        wallet: { userId: '', name: 'Admin', balance: 0, totalSent: 0, totalReceived: 0 },
        logs: [],
        pagination: { page: 1, totalPages: 1, totalRecords: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return "Invalid date";
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'admin_recharge':
        return 'text-green-600 bg-green-50';
      case 'admin_transfer':
        return 'text-blue-600 bg-blue-50';
      case 'transfer':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'admin_recharge':
        return <ArrowDownLeft className="w-3 h-3" />;
      case 'admin_transfer':
      case 'transfer':
        return <ArrowUpRight className="w-3 h-3" />;
      default:
        return <Wallet className="w-3 h-3" />;
    }
  };

  const getUserName = (user: any) => {
    if (!user) return 'System';
    if (typeof user === 'string') return user;
    return user.name || 'Unknown';
  };

  const handleRecharge = async () => {
    setRechargeError("");
    setRechargeSuccess("");
    setRechargeLoading(true);
    
    try {
      const amt = Number(rechargeAmount);
      if (isNaN(amt) || amt <= 0) {
        setRechargeError("Enter a valid amount");
        setRechargeLoading(false);
        return;
      }
      
      const res = await walletService.adminRecharge(amt);
      
      if (res.data?.success) {
        setRechargeSuccess("Recharge successful!");
        setTimeout(() => {
          setShowRechargeModal(false);
          setRechargeAmount("");
          setRechargeError("");
          setRechargeSuccess("");
          fetchData(); // Refresh data
        }, 1500);
      } else {
        setRechargeError(res.data?.message || "Recharge failed");
      }
    } catch (err: any) {
      setRechargeError(err?.response?.data?.message || err?.message || "Recharge failed");
    } finally {
      setRechargeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
          <p className="text-sm text-gray-500">Loading wallet data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      {/* Header with Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Admin Wallet
          </h1>
          <p className="text-gray-500 font-medium mt-1 text-sm sm:text-base">
            Manage RM Coins and view transaction history
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* RM Coins Card */}
      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-2xl p-6 border border-yellow-200 mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                <Coins className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-gray-900">RM Coins Wallet</h2>
            </div>
            <p className="text-sm text-gray-600">Transferable coins for users</p>
          </div>
          <button
            onClick={() => setShowRechargeModal(true)}
            className="px-4 py-2 bg-yellow-600 text-white rounded-xl font-bold text-sm hover:bg-yellow-700 transition shadow-md"
          >
            Recharge Wallet
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/80 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Current Balance</p>
            <p className="text-2xl font-black text-yellow-700">
              {rmcoins?.wallet?.balance?.toLocaleString() ?? 0}
            </p>
          </div>
          <div className="bg-white/80 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Total Sent</p>
            <p className="text-xl font-bold text-blue-600">
              {rmcoins?.wallet?.totalSent?.toLocaleString() ?? 0}
            </p>
          </div>
          <div className="bg-white/80 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Total Received</p>
            <p className="text-xl font-bold text-green-600">
              {rmcoins?.wallet?.totalReceived?.toLocaleString() ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Transaction Logs */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-yellow-50 to-transparent">
          <h2 className="text-lg font-black text-gray-900">Transaction History</h2>
          <p className="text-xs text-gray-500">Recent RM Coins transactions</p>
        </div>
        
        <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
          {rmcoins?.logs && rmcoins.logs.length > 0 ? (
            rmcoins.logs.map((log) => (
              <div key={log._id} className="p-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`p-1.5 rounded-lg ${getTransactionTypeColor(log.type)}`}>
                      {getTransactionIcon(log.type)}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {log.type?.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>
                  <span className={`text-sm font-black ${
                    ['admin_recharge', 'credit', 'transfer'].includes(log.type?.toLowerCase()) && 
                    log.toUserId ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {['admin_recharge', 'credit', 'transfer'].includes(log.type?.toLowerCase()) && 
                     log.toUserId ? '+' : '-'}{Math.abs(log.amount).toLocaleString()}
                  </span>
                </div>
                
                <div className="ml-8 space-y-1">
                  <p className="text-xs text-gray-600">
                    {log.description || 'No description'}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    <span>From: {getUserName(log.fromUserId)}</span>
                    <span>→</span>
                    <span>To: {getUserName(log.toUserId)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-400">
                    <span>ID: {log._id.slice(-6)}</span>
                    <span>{formatDate(log.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl mx-auto flex items-center justify-center mb-3">
                <Coins className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">No transactions found</p>
            </div>
          )}
        </div>
      </section>

      {/* RM Coins Recharge Modal */}
      {showRechargeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
              <h2 className="text-xl font-black">Recharge RM Coins</h2>
              <p className="text-sm opacity-90">Add coins to your admin wallet</p>
            </div>
            
            <div className="p-6">
              {rechargeError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                  {rechargeError}
                </div>
              )}
              
              {rechargeSuccess && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm">
                  {rechargeSuccess}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">
                    Amount
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={rechargeAmount}
                    onChange={(e) => setRechargeAmount(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none text-lg font-bold"
                    placeholder="Enter amount"
                    disabled={rechargeLoading || rechargeSuccess}
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowRechargeModal(false);
                      setRechargeAmount("");
                      setRechargeError("");
                      setRechargeSuccess("");
                    }}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition"
                    disabled={rechargeLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRecharge}
                    disabled={rechargeLoading || rechargeSuccess || !rechargeAmount}
                    className="flex-1 px-4 py-3 bg-yellow-600 text-white rounded-xl font-bold hover:bg-yellow-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {rechargeLoading ? "Processing..." : rechargeSuccess ? "Done" : "Recharge"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}