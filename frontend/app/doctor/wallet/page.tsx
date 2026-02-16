"use client";


import { useEffect, useState } from "react";
import { useAuthContext } from "@/state/AuthContext";
import { walletService } from "@/services/wallet.service";
import { Dialog } from "@headlessui/react";
import { ArrowUpRight, Loader2, Search, UserCircle, ArrowLeftRight } from "lucide-react";

export default function DoctorWalletPage() {
  const { user } = useAuthContext();
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
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
  const LIMIT = 10;

  // Fetch wallet and logs
  const loadWallet = async (pageNumber = 1, isLoadMore = false, searchVal = search) => {
    try {
      const res = await walletService.getWalletLogs({ page: pageNumber, limit: LIMIT, search: searchVal });
      setWallet(res.wallet);
      setTotalPages(res.pagination?.totalPages || 1);
      if (isLoadMore) {
        setTransactions((prev) => [...prev, ...(res.logs || [])]);
      } else {
        setTransactions(res.logs || []);
      }
    } catch (error) {
      // handle error UI
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { loadWallet(); }, []);

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

  // Transfer
  const handleTransfer = async () => {
    if (!transferAmount) {
      setTransferError("Please enter transfer amount");
      return;
    }
    try {
      setTransferLoading(true);
      setTransferError("");
      await walletService.transferToAdmin(Number(transferAmount));
      setTransferModal(false);
      setTransferAmount("");
      setPage(1);
      setLoading(true);
      loadWallet(1, false, search);
    } catch (error: any) {
      setTransferError(error?.response?.data?.message || "Transfer failed. Please try again.");
    } finally {
      setTransferLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8">
      <h1 className="text-2xl font-bold mb-6">My Wallet</h1>
      {/* Wallet Card */}
      <div className="bg-slate-900 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center mb-4">
          <UserCircle className="w-10 h-10 text-cyan-400" />
          <div className="ml-3">
            <div className="text-xs text-slate-400">Wallet Owner</div>
            <div className="font-bold text-lg">{wallet?.name || user?.name}</div>
          </div>
        </div>
        <div className="text-center mb-4">
          <div className="text-xs text-slate-400">Available RM Coin</div>
          <div className="text-3xl font-extrabold mt-1">{wallet?.balance ?? user?.rmCoinsBalance ?? 0} RM</div>
        </div>
        <div className="flex gap-4 justify-between mb-4">
          <div className="flex-1 bg-white/10 rounded-xl p-3 text-center">
            <div className="text-xs text-slate-300">Total Sent</div>
            <div className="font-bold text-rose-400">{wallet?.totalSent ?? 0} RM</div>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl p-3 text-center">
            <div className="text-xs text-slate-300">Total Received</div>
            <div className="font-bold text-emerald-400">{wallet?.totalReceived ?? 0} RM</div>
          </div>
        </div>
        <button className="w-full mt-2 flex items-center justify-center gap-2 bg-cyan-100 text-cyan-900 font-semibold py-2 rounded-xl hover:bg-cyan-200 transition" onClick={() => { setTransferError(""); setTransferModal(true); }}>
          <ArrowUpRight className="w-5 h-5" /> Transfer To Admin
        </button>
      </div>
            {/* Transfer Modal */}
            <Dialog open={transferModal} onClose={() => setTransferModal(false)} className="fixed z-50 inset-0 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen px-4">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                <div className="relative bg-white rounded-2xl p-6 w-full max-w-md mx-auto z-10">
                  <Dialog.Title className="text-lg font-bold mb-4">Transfer To Admin</Dialog.Title>
                  <input
                    type="number"
                    placeholder="Enter Amount"
                    value={transferAmount}
                    onChange={e => setTransferAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 mb-3"
                  />
                  {transferError && <div className="text-rose-600 text-sm mb-2">{transferError}</div>}
                  <button
                    className="w-full bg-cyan-500 text-white py-2 rounded-lg font-semibold hover:bg-cyan-600 transition mb-2"
                    onClick={handleTransfer}
                    disabled={transferLoading}
                  >
                    {transferLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Transfer"}
                  </button>
                  <button className="w-full text-cyan-500 py-2 rounded-lg font-semibold hover:underline" onClick={() => setTransferModal(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            </Dialog>
      {/* Search and History */}
      <form onSubmit={e => { e.preventDefault(); setPage(1); setSearch(searchInput); setLoading(true); loadWallet(1, false, searchInput); }} className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Search logs..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
        />
        <button type="submit" className="bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600 transition">
          <Search className="w-5 h-5" />
        </button>
      </form>
      <div className="space-y-3">
        {transactions.map((item) => {
          const isSent = item.fromUserId?._id === wallet?.userId;
          return (
            <div key={item._id} className="bg-white rounded-xl p-4 flex items-center border border-slate-100 shadow-sm">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 ${isSent ? 'bg-rose-50' : 'bg-emerald-50'}`}>
                <ArrowLeftRight className={`w-6 h-6 ${isSent ? 'text-rose-500' : 'text-emerald-500'}`} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <div className="font-semibold text-slate-900">{item.description}</div>
                  <div className={`font-bold ${isSent ? 'text-rose-500' : 'text-emerald-600'}`}>{isSent ? '-' : '+'}{item.amount} RM</div>
                </div>
                <div className="text-xs text-slate-500 mt-1">{new Date(item.createdAt).toLocaleString()}</div>
              </div>
            </div>
          );
        })}
        {loadingMore && <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-cyan-500" /></div>}
      </div>
      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-6">
        <button
          className="px-4 py-2 rounded bg-slate-100 text-slate-700 font-medium disabled:opacity-50"
          onClick={() => { if (page > 1) { setPage(page - 1); setLoading(true); loadWallet(page - 1, false, search); } }}
          disabled={page <= 1 || loading}
        >
          Previous
        </button>
        <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
        <button
          className="px-4 py-2 rounded bg-slate-100 text-slate-700 font-medium disabled:opacity-50"
          onClick={() => { if (page < totalPages) { setPage(page + 1); setLoading(true); loadWallet(page + 1, false, search); } }}
          disabled={page >= totalPages || loading}
        >
          Next
        </button>
      </div>
    </div>
  );
}
