"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/state/AuthContext";
import { rmcreditService } from "@/services/rmcredit.service";
import { 
  Shield, 
  Loader2, 
  RefreshCw,
  Calendar,
  Copy,
  Check,
  Clock,
  Wallet
} from "lucide-react";

interface CreditWallet {
  balance: number;
  totalCredit: number;
  usedCredit: number;
  expiryDate?: string;
  status?: string;
  revokeOtp?: string;
  revokeOtpExpiresAt?: string;
  revokeAmount?: number;
}

interface CreditTransaction {
  _id: string;
  amount: number;
  type: string;
  description?: string;
  performedBy?: string;
  createdAt: string;
}

export default function AgentCreditsPage() {
  const { user } = useAuthContext();
  const [wallet, setWallet] = useState<CreditWallet>({
    balance: 0,
    totalCredit: 0,
    usedCredit: 0,
    revokeOtp: null,
    revokeOtpExpiresAt: null,
    revokeAmount: null,
    expiryDate: null,
    status: null
  });
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [otpCopied, setOtpCopied] = useState(false);

  // Fetch credit wallet and logs
  const loadWallet = async () => {
    try {
      const res = await rmcreditService.getMyCreditDetails();
      
      if (res.data?.success && res.data.data) {
        const { wallet, transactions } = res.data.data;
        setWallet(wallet || { 
          balance: 0, 
          totalCredit: 0, 
          usedCredit: 0,
          revokeOtp: null,
          revokeOtpExpiresAt: null,
          revokeAmount: null,
          expiryDate: null,
          status: null
        });
        setTransactions(transactions || []);
      }
    } catch (err) {
      console.error("Error loading wallet:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { 
    loadWallet(); 
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWallet();
  };

  // Check if OTP is valid and not expired
  const showOtp = (() => {
    if (!wallet?.revokeOtp) return false;
    if (!wallet?.revokeOtpExpiresAt) return false;

    const isExpired = new Date(wallet.revokeOtpExpiresAt) < new Date();
    return !isExpired;
  })();

  const copyOtpToClipboard = () => {
    if (wallet?.revokeOtp) {
      navigator.clipboard.writeText(wallet.revokeOtp);
      setOtpCopied(true);
      setTimeout(() => setOtpCopied(false), 2000);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatExpiryDate = (dateString?: string) => {
    if (!dateString) return 'No expiry';
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getTransactionConfig = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'credit':
        return {
          bg: 'bg-emerald-50',
          color: 'text-emerald-600',
          sign: '+',
          label: 'Credit Added'
        };
      case 'revoke':
        return {
          bg: 'bg-rose-50',
          color: 'text-rose-600',
          sign: '-',
          label: 'Credit Revoked'
        };
      default:
        return {
          bg: 'bg-cyan-50',
          color: 'text-cyan-600',
          sign: '',
          label: type || 'Transaction'
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          <p className="text-sm text-gray-500">Loading credit wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8">
      {/* Header with Refresh */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">RM Credits</h1>
          <p className="text-sm text-gray-500">Your agent credit wallet</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl p-6 mb-6 text-white shadow-xl">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div className="ml-3">
            <div className="text-xs text-teal-100">Agent</div>
            <div className="font-bold text-lg">{user?.name || 'Agent'}</div>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="text-xs text-teal-100 mb-1">Available Balance</div>
          <div className="text-4xl font-extrabold">
            ₹ {wallet?.balance?.toLocaleString() ?? 0}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 rounded-xl p-3">
            <div className="text-xs text-teal-100">Total Credit</div>
            <div className="font-bold text-lg">₹ {wallet?.totalCredit?.toLocaleString() ?? 0}</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <div className="text-xs text-teal-100">Used Credit</div>
            <div className="font-bold text-lg">₹ {wallet?.usedCredit?.toLocaleString() ?? 0}</div>
          </div>
        </div>

        {wallet?.expiryDate && (
          <div className="flex items-center gap-2 text-xs text-teal-100 mt-4 border-t border-teal-500 pt-4">
            <Calendar className="w-4 h-4" />
            <span>Expires: {formatExpiryDate(wallet.expiryDate)}</span>
          </div>
        )}
      </div>

      {/* OTP Section - Show when revoke request is pending (Agent sees this) */}
      {showOtp && wallet && (
        <div className="bg-white rounded-xl p-5 mb-6 border-2 border-amber-200 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Revoke Request Initiated</h3>
              <p className="text-xs text-gray-500">Admin has requested to revoke credits. Share this OTP with admin.</p>
            </div>
          </div>
          
          <div className="space-y-3 bg-amber-50 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Amount to Revoke:</span>
              <span className="font-bold text-amber-700">₹ {wallet.revokeAmount?.toLocaleString() || 0}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">OTP:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-2xl text-rose-600 tracking-wider">
                  {wallet.revokeOtp}
                </span>
                <button
                  onClick={copyOtpToClipboard}
                  className="p-2 hover:bg-amber-100 rounded-lg transition"
                  title="Copy OTP"
                >
                  {otpCopied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Expires:</span>
              <span className="font-medium text-gray-700">
                {formatDate(wallet.revokeOtpExpiresAt)}
              </span>
            </div>

            <div className="mt-3 text-xs bg-blue-50 text-blue-700 p-2 rounded-lg">
              ⏰ This OTP will expire in 10 minutes. Share it with admin to complete the revoke process.
            </div>
          </div>
        </div>
      )}

      {/* Transactions Section */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Transaction History</h2>
        
        {transactions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto flex items-center justify-center mb-4">
              <Wallet className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-gray-700 font-medium mb-1">No transactions yet</h3>
            <p className="text-sm text-gray-500">
              Your credit transactions will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => {
              const config = getTransactionConfig(tx.type);
              
              return (
                <div 
                  key={tx._id} 
                  className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${config.bg} ${config.color}`}>
                          {config.label}
                        </span>
                        {tx.performedBy && (
                          <span className="text-xs text-gray-400">
                            by {tx.performedBy}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600">
                        {tx.description || 'No description'}
                      </p>
                      
                      <div className="text-xs text-gray-400 mt-2">
                        {formatDate(tx.createdAt)}
                      </div>
                    </div>
                    
                    <div className={`font-bold text-lg ${config.color}`}>
                      {config.sign} ₹ {tx.amount?.toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}