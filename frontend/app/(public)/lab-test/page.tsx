"use client";

import { useState } from "react";
import Footer from '@/components/layout/Footer';

export default function LabTestPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [filterCategory, setFilterCategory] = useState("all");

  const allTests = [
    { id: 1, name: "Absolute Lymphocyte Count (ALC)", category: "Haematology", description: "Measures lymphocyte count.", price: 140 },
    { id: 2, name: "Absolute Neutrophil Count (ANC)", category: "Haematology", description: "Measures neutrophils in blood.", price: 150 },
    { id: 3, name: "Blood Sugar (Fasting + PP)", category: "Diabetes", description: "Fasting and post-meal sugar measurement.", price: 199 },
    { id: 4, name: "Albumin/Creatinine Ratio (ACR)", category: "Biochemistry", description: "Kidney-function indicator.", price: 650 },
    { id: 5, name: "Vitamin D Test", category: "Vitamins", description: "Detects Vitamin D deficiency.", price: 799 },
    { id: 6, name: "Adenosine Deaminase (ADA)", category: "Biochemistry", description: "Helps identify TB infection.", price: 600 },
    { id: 7, name: "Thyroid Stimulating Hormone (TSH)", category: "Hormones", description: "Thyroid screening and monitoring.", price: 350 },
    { id: 8, name: "Lipid Profile", category: "Biochemistry", description: "Cholesterol and triglycerides panel.", price: 450 },
    { id: 9, name: "Complete Blood Count (CBC)", category: "Haematology", description: "General health screening test.", price: 250 }
  ];

  const categories = ["all", ...new Set(allTests.map((t) => t.category))];

  const filteredAndSortedTests = (() => {
    let filtered = allTests;

    if (searchQuery) {
      filtered = filtered.filter(
        (test) =>
          test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          test.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterCategory !== "all") {
      filtered = filtered.filter((test) => test.category === filterCategory);
    }

    return [...filtered].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      return 0;
    });
  })();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Main Content */}
      <div className="flex-grow pt-20 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background with glassmorphism effect */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-gray-100 to-slate-200 -z-10"></div>
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAgNGgtMnYyaDJ2LTJ6bTIgMHYyaDJ2LTJoLTJ6bTItMmgtMnYyaDJ2LTJ6bTItMnYyaDJ2LTJoLTJ6bS0yIDBoLTJ2Mmgydi0yem0wLTJoMnYtMmgtMnYyem0tNCAwaC0ydjJoMnYtMnptMi0yaC0ydjJoMnYtMnptMC0yaC0ydjJoMnYtMnptMiAydi0yaDJ2MmgtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40 -z-10"></div>

      <div className="max-w-7xl mx-auto text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 mb-2 sm:mb-3 bg-white/40 backdrop-blur-md px-3 sm:px-5 py-2 sm:py-2.5 rounded-full border border-white/60 shadow-lg">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
            Lab Test Catalog
          </h1>
        </div>
        <p className="text-gray-700 mt-2 text-sm sm:text-base max-w-2xl mx-auto font-medium px-4">
          Search, filter and book from 100+ certified lab tests with professional care.
        </p>
      </div>

      <div className="max-w-7xl mx-auto mb-6 p-4 sm:p-6 bg-white/30 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/50">
        <div className="flex items-center gap-2 mb-4 sm:mb-5">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">
            Find Your Test
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search Test
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/50 backdrop-blur-md border-2 border-white/60 rounded-xl py-2.5 pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-500 shadow-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-300 font-medium"
              />
              <svg className="absolute left-3 top-3 h-4 w-4 text-gray-600" fill="none" strokeWidth="2.5" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5-5m1-7a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              Category
            </label>
            <div className="relative">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-white/50 backdrop-blur-md border-2 border-white/60 rounded-xl py-2.5 pl-9 pr-8 text-sm text-gray-800 shadow-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-300 font-medium appearance-none cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)} ({cat === "all" ? allTests.length : allTests.filter((t) => t.category === cat).length})
                  </option>
                ))}
              </select>
              <svg className="absolute left-3 top-3 h-4 w-4 text-gray-600 pointer-events-none" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <svg className="absolute right-3 top-3 h-4 w-4 text-gray-600 pointer-events-none" fill="none" strokeWidth="2.5" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
              Sort By
            </label>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-white/50 backdrop-blur-md border-2 border-white/60 rounded-xl py-2.5 pl-9 pr-8 text-sm text-gray-800 shadow-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-300 font-medium appearance-none cursor-pointer"
              >
                <option value="name">Name (A-Z)</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <svg className="absolute left-3 top-3 h-4 w-4 text-gray-600 pointer-events-none" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
              <svg className="absolute right-3 top-3 h-4 w-4 text-gray-600 pointer-events-none" fill="none" strokeWidth="2.5" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-white/20 backdrop-blur-md px-4 py-3 rounded-xl border border-white/40">
        <h2 className="text-sm sm:text-base font-bold text-gray-800 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Showing <span className="bg-white/40 px-2 py-0.5 rounded-full ml-1">{filteredAndSortedTests.length}</span> test(s)
        </h2>
        <div className="text-xs sm:text-sm text-gray-700 font-medium">
          {filteredAndSortedTests.length > 0 && `${filteredAndSortedTests.length} results found`}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-7xl mx-auto">
        {filteredAndSortedTests.map((test) => (
          <div
            key={test.id}
            className="group bg-white/30 backdrop-blur-2xl rounded-2xl p-4 sm:p-5 shadow-2xl border border-white/50 hover:bg-white/40 hover:shadow-3xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
          >
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-3 sm:mb-4">
                <span className="text-[10px] sm:text-xs bg-white/50 backdrop-blur-md text-gray-800 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full font-bold uppercase tracking-wider shadow-md border border-white/60 flex items-center gap-1">
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" strokeWidth="2.5" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {test.category}
                </span>
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/40 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/60 shadow-lg">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 leading-tight group-hover:text-gray-700 transition-colors">
                {test.name}
              </h3>

              <p className="text-gray-700 text-xs sm:text-sm leading-relaxed min-h-10 sm:min-h-12 mb-4">
                {test.description}
              </p>

              <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-3 pt-3 sm:pt-4 border-t-2 border-white/40">
                <div className="flex flex-row justify-between items-center w-full">
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-600 font-semibold uppercase tracking-wide mb-0.5 flex items-center gap-1">
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Price
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-800">
                      ₹{test.price}
                    </p>
                  </div>
                  <button className="bg-cyan-600 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-lg hover:bg-cyan-700 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-1.5 ml-2 xs:ml-4">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredAndSortedTests.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white/30 rounded-xl shadow-md">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-base font-bold text-gray-600">No tests found.</p>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>

    {/* FOOTER */}
    <Footer />
    </div>
  );
}
