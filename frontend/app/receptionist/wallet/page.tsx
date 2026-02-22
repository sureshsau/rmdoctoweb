"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/state/AuthContext";
import { walletService } from "@/services/wallet.service";
import { Dialog } from "@headlessui/react";
import { ArrowUpRight, Loader2, Search, UserCircle, ArrowLeftRight, RefreshCw } from "lucide-react";

interface WalletData {
  userId: string;
  name: string;
  balance: number;
  totalSent: number;
  totalReceived: number;
}

interface Transaction {
  _id: string;
  amount: number;
  fromUserId?: { _id: string; name: string } | string;
  toUserId?: { _id: string; name: string } | string;
  type: string;
  description: string;
  createdAt: string;
}

interface WalletResponse {
  wallet: WalletData;
  logs: Transaction[];
  pagination: {
    page: number;
    totalPages: number;
    totalRecords: number;
  };
}

export default function ReceptionistWalletPage() {
  const { user } = useAuthContext();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [transferModal, setTransferModal] = useState(false);
  const [transferAmount, setTransferAmount] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState("");
  const [transferSuccess, setTransferSuccess] = useState(false);
  const LIMIT = 10;

  // Fetch wallet and logs
  const loadWallet = async (pageNumber = 1, isLoadMore = false, searchVal = search) => {
    try {
      const res = await walletService.getWalletLogs({ page: pageNumber, limit: LIMIT, search: searchVal });
      
      // Handle different response structures
      const responseData = res.data || res;
      
      setWallet(responseData.wallet || null);
      setTotalPages(responseData.pagination?.totalPages || 1);
      
      if (isLoadMore) {
        setTransactions((prev) => [...prev, ...(responseData.logs || [])]);
      } else {
        setTransactions(responseData.logs || []);
      }
    } catch (error: any) {
      console.error("Failed to load wallet:", error);
      // You might want to show a toast notification here
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { 
    loadWallet(); 
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadWallet(1, false, search);
  };

  const loadMore = () => {
    if (page < totalPages && !loadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      setLoadingMore(true);
      loadWallet(nextPage, true, search);
    }
  };

  // Search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
    setLoading(true);
    loadWallet(1, false, searchInput);
  };

  // Clear search
  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
    setLoading(true);
    loadWallet(1, false, "");
  };

  // Transfer
  const handleTransfer = async () => {
    if (!transferAmount) {
      setTransferError("Please enter transfer amount");
      return;
    }

    const amount = Number(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      setTransferError("Please enter a valid amount");
      return;
    }

    if (wallet && amount > wallet.balance) {
      setTransferError("Insufficient balance");
      return;
    }

    try {
      setTransferLoading(true);
      setTransferError("");
      setTransferSuccess(false);
      
      const res = await walletService.transferToAdmin(amount);
      
      if (res.data?.success) {
        setTransferSuccess(true);
        setTimeout(() => {
          setTransferModal(false);
          setTransferAmount("");
          setTransferError("");
          setTransferSuccess(false);
          setPage(1);
          setLoading(true);
          loadWallet(1, false, search);
        }, 1500);
      } else {
        setTransferError(res.data?.message || "Transfer failed. Please try again.");
      }
    } catch (error: any) {
      setTransferError(error?.response?.data?.message || "Transfer failed. Please try again.");
    } finally {
      setTransferLoading(false);
    }
  };

  const getUserName = (user: any) => {
    if (!user) return 'System';
    if (typeof user === 'string') return user;
    return user.name || 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-sm text-gray-500">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8">
      {/* Header with Refresh */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Wallet</h1>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Wallet Card */}
      <div className="bg-slate-900 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center mb-4">
          <UserCircle className="w-10 h-10 text-amber-400" />
          <div className="ml-3">
            <div className="text-xs text-slate-400">Wallet Owner</div>
            <div className="font-bold text-lg">{wallet?.name || user?.name || 'User'}</div>
          </div>
        </div>
        
        <div className="text-center mb-4">
          <div className="text-xs text-slate-400">Available Balance</div>
          <div className="text-3xl font-extrabold mt-1 text-amber-400">
            {wallet?.balance?.toLocaleString() ?? 0} RM
          </div>
        </div>
        
        <div className="flex gap-4 justify-between mb-4">
          <div className="flex-1 bg-white/10 rounded-xl p-3 text-center">
            <div className="text-xs text-slate-300">Total Sent</div>
            <div className="font-bold text-rose-400">{wallet?.totalSent?.toLocaleString() ?? 0} RM</div>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl p-3 text-center">
            <div className="text-xs text-slate-300">Total Received</div>
            <div className="font-bold text-emerald-400">{wallet?.totalReceived?.toLocaleString() ?? 0} RM</div>
          </div>
        </div>
        
        <button 
          className="w-full mt-2 flex items-center justify-center gap-2 bg-amber-100 text-amber-900 font-semibold py-2 rounded-xl hover:bg-amber-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => { 
            setTransferError(""); 
            setTransferSuccess(false);
            setTransferModal(true); 
          }}
          disabled={!wallet || wallet.balance <= 0}
        >
          <ArrowUpRight className="w-5 h-5" /> Transfer To Admin
        </button>
        {wallet && wallet.balance <= 0 && (
          <p className="text-xs text-amber-300 text-center mt-2">Insufficient balance to transfer</p>
        )}
      </div>

      {/* Search and History */}
      <div className="mb-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button 
            type="submit" 
            className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition disabled:opacity-50"
            disabled={loading}
          >
            <Search className="w-5 h-5" />
          </button>
        </form>
        {search && (
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm text-gray-500">Search results for: "{search}"</p>
            <button 
              onClick={clearSearch}
              className="text-xs text-amber-600 hover:underline"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {transactions.length > 0 ? (
          transactions.map((item) => {
            const isSent = item.fromUserId && 
              (typeof item.fromUserId === 'string' 
                ? item.fromUserId === wallet?.userId 
                : item.fromUserId._id === wallet?.userId);
            
            return (
              <div key={item._id} className="bg-white rounded-xl p-4 flex items-center border border-slate-100 shadow-sm hover:shadow-md transition">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 ${isSent ? 'bg-rose-50' : 'bg-emerald-50'}`}>
                  <ArrowLeftRight className={`w-6 h-6 ${isSent ? 'text-rose-500' : 'text-emerald-500'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <div className="font-semibold text-slate-900">{item.description || 'Transaction'}</div>
                    <div className={`font-bold ${isSent ? 'text-rose-500' : 'text-emerald-600'}`}>
                      {isSent ? '-' : '+'}{item.amount?.toLocaleString()} RM
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <span>From: {getUserName(item.fromUserId)}</span>
                    <span>→</span>
                    <span>To: {getUserName(item.toUserId)}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <div className="w-12 h-12 bg-gray-200 rounded-xl mx-auto flex items-center justify-center mb-3">
              <ArrowLeftRight className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500">No transactions found</p>
          </div>
        )}
        
        {loadingMore && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && transactions.length > 0 && (
        <div className="flex justify-between items-center mt-6">
          <button
            className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => { 
              if (page > 1) { 
                setPage(page - 1); 
                setLoading(true); 
                loadWallet(page - 1, false, search); 
              } 
            }}
            disabled={page <= 1 || loading}
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => { 
              if (page < totalPages) { 
                setPage(page + 1); 
                setLoading(true); 
                loadWallet(page + 1, false, search); 
              } 
            }}
            disabled={page >= totalPages || loading}
          >
            Next
          </button>
        </div>
      )}

      {/* Transfer Modal */}
      <Dialog open={transferModal} onClose={() => !transferLoading && setTransferModal(false)} className="fixed z-50 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md mx-auto z-10">
            <Dialog.Title className="text-lg font-bold mb-4">Transfer To Admin</Dialog.Title>
            
            {transferSuccess ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-green-600 font-medium">Transfer successful!</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="text-sm text-gray-600 mb-1 block">Amount (RM)</label>
                  <input
                    type="number"
                    min="1"
                    max={wallet?.balance}
                    placeholder="Enter Amount"
                    value={transferAmount}
                    onChange={e => setTransferAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    disabled={transferLoading}
                  />
                  {wallet && (
                    <p className="text-xs text-gray-500 mt-1">
                      Available balance: {wallet.balance.toLocaleString()} RM
                    </p>
                  )}
                </div>
                
                {transferError && (
                  <div className="text-rose-600 text-sm mb-3 bg-rose-50 p-2 rounded-lg">
                    {transferError}
                  </div>
                )}
                
                <button
                  className="w-full bg-amber-500 text-white py-2 rounded-lg font-semibold hover:bg-amber-600 transition disabled:opacity-50 mb-2"
                  onClick={handleTransfer}
                  disabled={transferLoading || !transferAmount}
                >
                  {transferLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    "Transfer"
                  )}
                </button>
              </>
            )}
            
            <button 
              className="w-full text-amber-500 py-2 rounded-lg font-semibold hover:underline disabled:opacity-50" 
              onClick={() => setTransferModal(false)}
              disabled={transferLoading}
            >
              {transferSuccess ? "Close" : "Cancel"}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}