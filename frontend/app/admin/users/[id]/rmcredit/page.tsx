"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { rmcreditService } from "@/services/rmcredit.service";
import { 
  Loader2, 
  Calendar,
  Wallet,
  Plus,
  Minus,
  ChevronRight,
  User,
  Phone,
  Badge,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  X
} from "lucide-react";
import { Dialog } from "@headlessui/react";
import Link from "next/link";

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

interface Toast {
  message: string;
  type: "success" | "error" | "info";
  id: string;
}

export default function AdminAgentRMCreditPage() {
  const searchParams = useSearchParams();
  const agentId = searchParams.get("id");
  const name = searchParams.get("name") || "Agent";
  const phone = searchParams.get("phone") || "-";
  const role = searchParams.get("role") || "-";

  // Toast state
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

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
  const [btnLoading, setBtnLoading] = useState(false);

  // Modal states
  const [addModal, setAddModal] = useState(false);
  const [revokeModal, setRevokeModal] = useState(false);
  const [verifyModal, setVerifyModal] = useState(false);

  // Form states
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [expiryDate, setExpiryDate] = useState(new Date().toISOString().split('T')[0]);
  const [otp, setOtp] = useState("");

  const fetchData = async (isRefresh = false) => {
    if (!agentId) return;
    
    try {
      if (!isRefresh) setLoading(true);
      
      const res = await rmcreditService.getAgentCreditDetails(agentId);
      
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
      console.error("Error fetching data:", err);
      setWallet({
        balance: 0,
        totalCredit: 0,
        usedCredit: 0,
        revokeOtp: null,
        revokeOtpExpiresAt: null,
        revokeAmount: null,
        expiryDate: null,
        status: null
      });
      setTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [agentId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData(true);
  };

  // Add Credit
  const handleAddCredit = async () => {
    if (!agentId) return;
    
    try {
      setBtnLoading(true);
      
      const res = await rmcreditService.addCredit(
        agentId,
        Number(amount),
        new Date(expiryDate).toISOString(),
        description
      );
      
      if (res.data?.success) {
        showToast("Credit Added Successfully", "success");
        setAddModal(false);
        setAmount("");
        setDescription("");
        setExpiryDate(new Date().toISOString().split('T')[0]);
        fetchData();
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to add credit", "error");
    } finally {
      setBtnLoading(false);
    }
  };

  // Request Revoke
  const handleRequestRevoke = async () => {
    if (!agentId) return;
    
    try {
      setBtnLoading(true);
      
      const res = await rmcreditService.requestRevokeCredit(agentId, Number(amount));
      
      if (res.data?.success) {
        showToast("OTP Sent Successfully", "success");
        setRevokeModal(false);
        setVerifyModal(true);
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to request revoke", "error");
    } finally {
      setBtnLoading(false);
    }
  };

  // Verify Revoke
  const handleVerifyRevoke = async () => {
    if (!agentId) return;
    
    try {
      setBtnLoading(true);
      
      const res = await rmcreditService.verifyRevokeCredit(agentId, otp);
      
      if (res.data?.success) {
        showToast("Credit Revoked Successfully", "success");
        setVerifyModal(false);
        setOtp("");
        setAmount("");
        fetchData();
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Invalid OTP", "error");
    } finally {
      setBtnLoading(false);
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
    if (!dateString) return '-';
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

  if (!agentId) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg inline-block">
          Agent ID is missing in the URL.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-sm text-gray-500">Loading credit wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-indigo-50">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`animate-slideIn ${
              toast.type === "success" ? "bg-emerald-50 border-emerald-200" :
              toast.type === "error" ? "bg-rose-50 border-rose-200" :
              "bg-blue-50 border-blue-200"
            } border rounded-xl shadow-lg p-4 flex items-center gap-3 min-w-[300px]`}
          >
            {toast.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-600" />}
            {toast.type === "error" && <AlertCircle className="w-5 h-5 text-rose-600" />}
            {toast.type === "info" && <AlertCircle className="w-5 h-5 text-blue-600" />}
            <p className={`text-sm font-medium flex-1 ${
              toast.type === "success" ? "text-emerald-600" :
              toast.type === "error" ? "text-rose-600" :
              "text-blue-600"
            }`}>
              {toast.message}
            </p>
            <button onClick={() => removeToast(toast.id)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="bg-white border-b border-indigo-100 px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/admin/users" className="hover:text-indigo-600">Users</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">{name}</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-indigo-600">RM Credits</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-24">
        {/* Agent Info Card */}
        <div className="bg-white rounded-2xl p-5 mb-5 shadow-sm border border-indigo-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">{role}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Phone className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">{phone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-indigo-600 rounded-2xl p-6 mb-6 text-white shadow-lg">
          <div className="mb-4">
            <p className="text-indigo-200 text-xs mb-1">Current Balance</p>
            <p className="text-4xl font-extrabold">₹ {wallet.balance.toLocaleString()}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-indigo-500/30 rounded-xl p-3">
            <div className="text-center">
              <p className="text-indigo-200 text-xs">Total</p>
              <p className="font-bold text-sm">₹ {wallet.totalCredit.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-indigo-200 text-xs">Used</p>
              <p className="font-bold text-sm">₹ {wallet.usedCredit.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-indigo-200 text-xs">Expiry</p>
              <p className="font-bold text-sm">{formatExpiryDate(wallet.expiryDate)}</p>
            </div>
          </div>
        </div>

        {/* Actions Section */}
        <div className="mb-4">
          <h3 className="text-sm font-bold text-gray-600 mb-3">Wallet Actions</h3>
          
          <button
            onClick={() => {
              setAmount("");
              setDescription("");
              setAddModal(true);
            }}
            className="w-full bg-white rounded-xl p-4 mb-3 flex items-center gap-4 border border-indigo-100 hover:bg-indigo-50 transition"
          >
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <Plus className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="font-medium text-gray-700">Add Credit</span>
          </button>

          <button
            onClick={() => {
              setAmount("");
              setRevokeModal(true);
            }}
            disabled={wallet.balance <= 0}
            className="w-full bg-white rounded-xl p-4 flex items-center gap-4 border border-indigo-100 hover:bg-indigo-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <Minus className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="font-medium text-gray-700">Revoke Credit</span>
          </button>
        </div>

        {/* Transactions Section */}
        <div>
          <h3 className="text-sm font-bold text-gray-600 mb-3">Recent Transactions</h3>
          
          {transactions.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-indigo-100">
              <Wallet className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx._id} className="bg-white rounded-xl p-4 border border-indigo-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          tx.type === 'credit' 
                            ? 'bg-emerald-50 text-emerald-600' 
                            : 'bg-rose-50 text-rose-600'
                        }`}>
                          {tx.type === 'credit' ? 'CREDIT' : 'REVOKE'}
                        </span>
                        {tx.performedBy && (
                          <span className="text-xs text-gray-400">by {tx.performedBy}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{tx.description || 'No description'}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(tx.createdAt)}</p>
                    </div>
                    <p className={`font-bold text-lg ${
                      tx.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {tx.type === 'credit' ? '+' : '-'} ₹ {tx.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Credit Modal */}
      <Dialog open={addModal} onClose={() => setAddModal(false)} className="fixed z-40 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md mx-auto z-10">
            <Dialog.Title className="text-lg font-bold text-gray-900 mb-4">Add Credit</Dialog.Title>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Amount</label>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block">Expiry Date</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block">Description (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter description"
                />
              </div>

              <button
                onClick={handleAddCredit}
                disabled={btnLoading || !amount}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {btnLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Submit'}
              </button>

              <button
                onClick={() => setAddModal(false)}
                className="w-full text-gray-500 py-2 text-sm hover:underline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Revoke Modal */}
      <Dialog open={revokeModal} onClose={() => setRevokeModal(false)} className="fixed z-40 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md mx-auto z-10">
            <Dialog.Title className="text-lg font-bold text-gray-900 mb-4">Revoke Credit</Dialog.Title>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Amount</label>
                <input
                  type="number"
                  min="1"
                  max={wallet.balance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter amount"
                />
                {wallet.balance > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Max available: ₹ {wallet.balance.toLocaleString()}
                  </p>
                )}
              </div>

              <button
                onClick={handleRequestRevoke}
                disabled={btnLoading || !amount}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {btnLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Submit'}
              </button>

              <button
                onClick={() => setRevokeModal(false)}
                className="w-full text-gray-500 py-2 text-sm hover:underline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Verify OTP Modal */}
      <Dialog open={verifyModal} onClose={() => setVerifyModal(false)} className="fixed z-40 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md mx-auto z-10">
            <Dialog.Title className="text-lg font-bold text-gray-900 mb-4">Verify OTP</Dialog.Title>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Enter OTP</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="6-digit OTP"
                />
              </div>

              {wallet.revokeOtp && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-700">OTP generated: <span className="font-mono font-bold">{wallet.revokeOtp}</span></p>
                  <p className="text-xs text-amber-600 mt-1">Expires: {formatDate(wallet.revokeOtpExpiresAt)}</p>
                </div>
              )}

              <button
                onClick={handleVerifyRevoke}
                disabled={btnLoading || !otp}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {btnLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Submit'}
              </button>

              <button
                onClick={() => setVerifyModal(false)}
                className="w-full text-gray-500 py-2 text-sm hover:underline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}