"use client";

import { useEffect, useState } from "react";
import { medicineService, Medicine } from "@/services/medicine.service";
import MedicineCard from "@/components/store/MedicineCard";
import { Search, ShoppingBag, Filter, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useMedicineCart } from "@/context/MedicineCartContext";
import { useRouter } from "next/navigation";

const CATEGORIES = ["All", "Tablet", "Capsule", "Syrup", "Injection", "Cream", "Other"];

export default function PublicMedicineStorePage() {
  const router = useRouter();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  const { totalItems, totalPrice } = useMedicineCart();

  useEffect(() => {
    loadMedicines();
  }, [category]);

  async function loadMedicines() {
    setLoading(true);
    try {
      const res = await medicineService.getAllMedicines({
        dosageForm: category === "All" ? undefined : category
      });
      if (res && res.data) {
        setMedicines(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = medicines.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.brandName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative">
      {/* Header */}
      <div className="bg-white sticky top-0 z-30 shadow-sm border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              placeholder="Search for medicines..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-transparent focus:bg-white focus:ring-2 focus:ring-cyan-500 rounded-xl text-sm transition outline-none"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {/* Mobile Cart Icon */}
          <Link href="/medicine-store/cart" className="relative p-2.5 bg-cyan-50 text-cyan-700 rounded-xl hover:bg-cyan-100 transition md:hidden">
            <ShoppingBag className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                {totalItems}
              </span>
            )}
          </Link>
        </div>

        {/* Categories Scroll */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 px-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition
                  ${category === cat
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }
                `}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto p-4">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
              <div key={i} className="bg-white h-64 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Filter className="w-12 h-12 mb-4 opacity-20" />
            <p>No medicines found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map(item => (
              <MedicineCard key={item._id} medicine={item} />
            ))}
          </div>
        )}
      </div>

      {/* Floating Bottom Bar (Mobile/Desktop Cart Summary) */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-40 animate-slide-up">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Total ({totalItems} items)</p>
              <p className="text-xl font-bold text-gray-900">₹{totalPrice}</p>
            </div>
            <Link
              href="/medicine-store/cart"
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-cyan-200 transition flex items-center gap-2"
            >
              View Cart <ShoppingBag className="w-5 h-5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}