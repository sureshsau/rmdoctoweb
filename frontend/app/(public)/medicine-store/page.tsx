'use client';
import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Star, ArrowUpDown, Menu, X } from 'lucide-react';

const MedicineStore = () => {
  const [selectedCategory, setSelectedCategory] = useState('Top picks - Ayurveda');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const categories = [
    { 
      name: 'Top picks - Ayurveda', 
      icon: '🌿',
      isActive: true,
      bgColor: 'from-rose-400 to-orange-300'
    },
    { 
      name: 'Mind Care', 
      icon: '🧠',
      bgColor: 'bg-slate-100'
    },
    { 
      name: 'Sexual Wellness', 
      image: 'https://images.unsplash.com/photo-1542385151-efd9000785a0?w=100&h=100&fit=crop',
      bgColor: 'bg-slate-100'
    },
    { 
      name: 'Bone, Joint & Muscle', 
      icon: '🦴',
      bgColor: 'bg-slate-100'
    },
    { 
      name: 'Ayurvedic Stomach Care', 
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=100&h=100&fit=crop',
      bgColor: 'bg-slate-100'
    },
    { 
      name: 'Cough, Cold & Fever', 
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&h=100&fit=crop',
      bgColor: 'bg-slate-100'
    },
    { 
      name: 'Diabetes Care', 
      icon: '🩺',
      bgColor: 'bg-slate-100'
    },
  ];

  const products = [
    {
      id: 1,
      name: 'Himalaya Wellness Himalaya Ashwagandha Tablet | Stress Relief Supplement | Rejuvenates Mind & Body',
      image: 'https://images.unsplash.com/photo-1626285861696-9f0bf5a49c6d?w=400&h=400&fit=crop&q=80',
      originalPrice: '₹260',
      salePrice: '₹234',
      carePrice: '₹211',
      discount: '10% off',
      rating: 4.4,
      reviews: '3816 ratings',
      delivery: '2pm, Tomorrow',
      tablets: '60 tablets',
      bestseller: true
    },
    {
      id: 2,
      name: 'Panch Tulsi Drops for Respiratory Relief and Healthy Immunity | by Tata 1mg',
      image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400&h=400&fit=crop&q=80',
      originalPrice: '₹164',
      salePrice: '₹85',
      carePrice: '₹76.5',
      discount: '48% off',
      rating: 4.5,
      reviews: '1119 ratings',
      delivery: '2pm, Tomorrow',
      volume: '30 ml Drop',
      bestseller: true
    },
    {
      id: 3,
      name: 'Dabur Chyawanprash | 2X Immunity | Helps Protect from Common Illnesses',
      image: 'https://images.unsplash.com/photo-1610725664285-7c57e6eeac3f?w=400&h=400&fit=crop&q=80',
      originalPrice: '₹395',
      salePrice: '₹348',
      carePrice: '₹313',
      discount: '12% off',
      rating: 4.3,
      reviews: '15420 ratings',
      delivery: '6pm, Today',
      weight: '1 kg Paste',
      bestseller: false
    },
    {
      id: 4,
      name: 'Kapiva Himalayan Shilajit | Endurance, Stamina & Strength',
      image: 'https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/917d6f93-fb36-439a-8c48-884b67b35381_1600w.jpg',
      originalPrice: '₹1499',
      salePrice: '₹899',
      carePrice: '₹809',
      discount: '40% off',
      rating: 4.1,
      reviews: '842 ratings',
      delivery: '11am, Tomorrow',
      weight: '20g Resin',
      bestseller: false
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] antialiased flex flex-col">
      <Navbar />
      
      {/* Mobile Categories Button */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <Menu className="w-5 h-5" />
          <span className="text-sm font-medium">Categories</span>
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-80 bg-white h-full overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="space-y-1 p-4">
              {categories.map((category, index) => (
                <a
                  key={index}
                  href="#"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                    category.isActive 
                      ? 'bg-rose-50 border border-rose-200 text-rose-600 font-medium' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } transition-colors`}
                  onClick={() => {
                    setSelectedCategory(category.name);
                    setSidebarOpen(false);
                  }}
                >
                  <div className={`w-10 h-10 rounded-lg shrink-0 flex items-center justify-center overflow-hidden ${
                    category.isActive 
                        ? `bg-linear-to-br ${category.bgColor}` 
                      : category.bgColor
                  }`}>
                    {category.image ? (
                      <div 
                        className="w-full h-full bg-cover bg-center opacity-70"
                        style={{ backgroundImage: `url(${category.image})` }}
                      />
                    ) : (
                      <span className="text-sm">{category.icon}</span>
                    )}
                  </div>
                  <span className="text-sm">{category.name}</span>
                </a>
              ))}
            </nav>
          </aside>
        </div>
      )}
      
      {/* Main Content Layout */}
      <div className="flex max-w-[1600px] mx-auto w-full flex-1">
        
        {/* Desktop Sidebar */}
        <aside className="w-64 hidden lg:block bg-white h-[calc(100vh-64px)] overflow-y-auto sticky top-16 border-r border-gray-100 py-4">
          <nav className="space-y-1">
            {categories.map((category, index) => (
              <a
                key={index}
                href="#"
                className={`flex items-center gap-3 px-4 py-3 ${
                  category.isActive 
                    ? 'bg-rose-50 border-r-4 border-rose-500 text-rose-600 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } transition-colors`}
                onClick={() => setSelectedCategory(category.name)}
              >
                <div className={`w-10 h-10 rounded-lg shrink-0 flex items-center justify-center overflow-hidden ${
                  category.isActive 
                    ? `bg-linear-to-br ${category.bgColor}` 
                    : category.bgColor
                }`}>
                  {category.image ? (
                    <div 
                      className="w-full h-full bg-cover bg-center opacity-70"
                      style={{ backgroundImage: `url(${category.image})` }}
                    />
                  ) : (
                    <span className="text-sm">{category.icon}</span>
                  )}
                </div>
                <span className="text-sm">{category.name}</span>
              </a>
            ))}
          </nav>
        </aside>

        {/* Product Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900">Ayurvedic Top Picks</h1>
            <button className="flex items-center gap-2 bg-white border border-gray-200 shadow-sm rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Sort
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>

          {/* Products List */}
          <div className="space-y-3 sm:space-y-4">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-xl border border-gray-200 p-3 sm:p-5 flex flex-col lg:flex-row gap-4 sm:gap-6 hover:shadow-sm transition-shadow">
                {/* Image */}
                <div className="w-full lg:w-48 h-40 sm:h-48 shrink-0 flex items-center justify-center p-2">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="max-h-full object-contain mix-blend-multiply opacity-90"
                  />
                </div>
                
                {/* Details */}
                <div className="flex-1 flex flex-col justify-start pt-1">
                  {product.bestseller && (
                    <div className="mb-2">
                      <span className="inline-block bg-orange-50 text-orange-700 text-xs sm:text-[10px] font-semibold px-1.5 py-0.5 rounded border border-orange-100">
                        Bestseller+
                      </span>
                    </div>
                  )}
                  {!product.bestseller && <div className="mb-2 h-[22px]"></div>}
                  
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 leading-snug mb-1">
                    {product.name}
                  </h2>
                  <p className="text-sm text-gray-500 mb-3">
                    {product.tablets || product.volume || product.weight}
                  </p>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <span className="inline-flex items-center gap-1 bg-green-700 text-white text-xs font-bold px-1.5 py-0.5 rounded-sm">
                      {product.rating} <Star className="w-2.5 h-2.5 fill-current" />
                    </span>
                    <span className="text-sm text-gray-500">{product.reviews}</span>
                  </div>

                  <div className="mt-auto">
                    <p className="text-xs text-gray-500">
                      Get by <span className="font-bold text-gray-900">{product.delivery}</span>
                    </p>
                  </div>
                </div>

                {/* Pricing Action */}
                <div className="w-full lg:w-64 shrink-0 flex flex-col items-stretch lg:items-end justify-between border-t lg:border-t-0 lg:border-l border-gray-100 lg:pl-6 pt-4 lg:pt-0">
                  <div className="w-full text-center lg:text-right mb-4">
                    <div className="flex items-center justify-center lg:justify-end gap-2 text-xs mb-0.5">
                      <span className="text-gray-400 line-through">{product.originalPrice}</span>
                      <span className="text-green-600 font-bold">{product.discount}</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">{product.salePrice}</div>
                  </div>

                  <div className="w-full space-y-3">
                    <div className="bg-rose-50 rounded text-right flex items-stretch overflow-hidden">
                      <div className="bg-rose-600 text-white text-xs sm:text-[10px] font-bold px-1.5 flex items-center">CARE</div>
                      <div className="flex-1 py-1 px-2 flex justify-between items-center text-xs">
                        <span className="text-gray-500">price</span>
                        <span className="font-bold text-gray-900">{product.carePrice}</span>
                      </div>
                    </div>
                    <div className="text-xs sm:text-[10px] text-right text-rose-500 font-medium -mt-2">order for ₹1200</div>

                    <button className="w-full py-3 sm:py-2 border border-rose-500 text-rose-600 font-bold rounded hover:bg-rose-50 transition-colors text-sm tracking-wide">
                      ADD
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MedicineStore;