"use client";

import { useEffect, useState, useCallback } from "react";
import { medicineService, Medicine } from "@/services/medicine.service";
import MedicineCard from "@/components/store/MedicineCard";
import { Search, ShoppingBag, Filter, ArrowLeft, ChevronLeft, ChevronRight, X, ClipboardList } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMedicineCart } from "@/context/MedicineCartContext";
import Link from "next/link";

// Simple debounce implementation
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

const CATEGORIES = ["All", "Tablet", "Capsule", "Syrup", "Injection", "Cream", "Drops", "Inhaler", "Other"];

export default function PublicMedicineStorePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL State
  const page = Number(searchParams.get("page")) || 1;
  const initialCategory = searchParams.get("category") || "All";
  const initialSearch = searchParams.get("q") || "";

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    limit: 10
  });

  // Local state for immediate UI feedback
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const { totalItems, totalPrice } = useMedicineCart();

  const loadMedicines = useCallback(async (p: number, cat: string, q: string) => {
    setLoading(true);
    try {
      const res = await medicineService.getAllMedicines({
        page: p,
        limit: 10,
        search: q,
        dosageForm: cat === "All" ? undefined : cat
      });
      setMedicines(res.data);
      setPagination({
        total: res.pagination.total,
        totalPages: res.pagination.totalPages,
        limit: res.pagination.limit
      });
    } catch (err) {
      console.error("Failed to load medicines:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedicines(page, initialCategory, initialSearch);
  }, [page, initialCategory, initialSearch, loadMedicines]);

  // Debounced search logic
  const debouncedSearch = useCallback(
    debounce((q: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (q) params.set("q", q);
      else params.delete("q");
      params.set("page", "1"); // Reset to page 1 on search
      router.push(`?${params.toString()}`);
    }, 500),
    [searchParams, router]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    debouncedSearch(val);
  };

  const handleCategoryChange = (cat: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", cat);
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const clearSearch = () => {
    setSearchTerm("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header Section */}
      <div className="bg-white sticky top-0 z-30 border-b border-gray-100 shadow-sm px-4 py-4 md:py-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2.5 hover:bg-gray-50 rounded-2xl border border-transparent hover:border-gray-100 transition-all text-gray-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-cyan-600 transition-colors" />
              <input
                placeholder="Search by name, brand, or composition..."
                className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border-gray-100 focus:bg-white focus:ring-4 focus:ring-cyan-50 rounded-2xl text-base font-medium transition-all outline-none border hover:border-cyan-200"
                value={searchTerm}
                onChange={handleSearchChange}
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {/* My Orders Link (Desktop) */}
            <Link
              href="/medicine-store/orders"
              className="hidden md:flex items-center gap-3 px-5 py-3.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-100 rounded-2xl font-bold transition-all hover:border-cyan-200"
            >
              <ClipboardList className="w-5 h-5 text-cyan-600" />
              <span>My Orders</span>
            </Link>

            {/* Cart Preview (Desktop) */}
            <Link
              href="/medicine-store/cart"
              className="hidden md:flex items-center gap-3 px-5 py-3.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-2xl font-bold shadow-lg shadow-cyan-100 transition-all hover:-translate-y-0.5"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Cart ({totalItems})</span>
              <span className="w-px h-4 bg-white/20 mx-1" />
              <span>₹{totalPrice}</span>
            </Link>
          </div>

          {/* Categories Grid/Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-6 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-300
                  ${initialCategory === cat
                    ? "bg-cyan-600 text-white shadow-lg shadow-cyan-100 ring-2 ring-cyan-600 ring-offset-2"
                    : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-100 hover:border-cyan-200"
                  }
                `}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              {initialCategory === "All" ? "Essential Medicines" : `${initialCategory}s`}
            </h2>
            <p className="text-sm text-gray-500 font-medium mt-1">
              Showing {medicines.length} of {pagination.total} medicines
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-gray-100 text-xs font-bold text-gray-400 tracking-widest uppercase">
            <Filter size={14} /> Sort: Default
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-white rounded-[32px] p-6 space-y-4 shadow-sm border border-gray-50 animate-pulse">
                <div className="aspect-square bg-gray-50 rounded-2xl" />
                <div className="h-4 bg-gray-50 rounded w-3/4" />
                <div className="h-4 bg-gray-50 rounded w-1/2" />
                <div className="pt-4 h-10 bg-gray-50 rounded-xl" />
              </div>
            ))}
          </div>
        ) : medicines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-[40px] border border-gray-50 shadow-sm">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <Search className="w-10 h-10 text-gray-200" />
            </div>
            <h3 className="text-xl font-black text-gray-900">No medicines found</h3>
            <p className="text-gray-500 mt-2 max-w-xs mx-auto font-medium">
              We couldn't find any results for "{searchTerm}". Try checking for typos or use different keywords.
            </p>
            <button
              onClick={clearSearch}
              className="mt-8 px-8 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {medicines.map(item => (
                <MedicineCard key={item._id} medicine={item} />
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="mt-16 flex items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white transition-all text-gray-600"
                >
                  <ChevronLeft size={20} />
                </button>

                {[...Array(pagination.totalPages)].map((_, i) => {
                  const pNum = i + 1;
                  // Only show current, first, last, and neighbors
                  if (
                    pNum === 1 ||
                    pNum === pagination.totalPages ||
                    (pNum >= page - 1 && pNum <= page + 1)
                  ) {
                    return (
                      <button
                        key={pNum}
                        onClick={() => handlePageChange(pNum)}
                        className={`w-12 h-12 rounded-2xl font-bold transition-all
                          ${page === pNum
                            ? "bg-cyan-600 text-white shadow-lg shadow-cyan-100"
                            : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-100"
                          }
                        `}
                      >
                        {pNum}
                      </button>
                    );
                  }
                  if (pNum === page - 2 || pNum === page + 2) {
                    return <span key={pNum} className="text-gray-300 font-bold px-2">...</span>;
                  }
                  return null;
                })}

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === pagination.totalPages}
                  className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white transition-all text-gray-600"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Bottom Bar (Mobile Cart) */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-5px_30px_rgba(0,0,0,0.08)] p-6 z-40 md:hidden animate-in slide-in-from-bottom-full duration-500">
          <Link
            href="/medicine-store/cart"
            className="w-full flex items-center justify-between bg-cyan-600 hover:bg-cyan-700 text-white p-5 rounded-3xl font-bold shadow-xl shadow-cyan-200 transition-all active:scale-95"
          >
            <div className="flex flex-col items-start translate-x-1">
              <span className="text-[10px] uppercase tracking-widest opacity-70">Checkout Items</span>
              <span className="text-sm">{totalItems} Medicine{totalItems > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg">₹{totalPrice}</span>
              <ShoppingBag size={20} />
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
