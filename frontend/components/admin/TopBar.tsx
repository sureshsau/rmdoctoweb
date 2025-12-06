'use client';

import React, { useState } from 'react';
import { Bell, Search, User, Menu } from 'lucide-react';
import { Input } from './Input';

interface TopBarProps {
  onToggleSidebar: () => void;
  onToggleMobileSidebar: () => void;
}

export function TopBar({ onToggleSidebar, onToggleMobileSidebar }: TopBarProps) {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <header className="glass-card sticky top-0 z-40 px-6 py-4 shadow-lg">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-4 flex-1">
          {/* Mobile toggle - ONLY MOBILE */}
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2.5 rounded-xl hover:bg-white/80 smooth-transition icon-hover shadow-sm"
            aria-label="Toggle mobile menu"
          >
            <Menu className="h-5 w-5 text-gray-700" />
          </button>

          {/* Simple header title for desktop */}
          <div className="hidden md:block">
            <h1 className="text-xl font-semibold text-gray-900">Hospital Management</h1>
          </div>

          {/* Search - ONLY MOBILE IN DROPDOWN */}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Mobile search toggle */}
          <button 
            onClick={() => setShowSearch(!showSearch)}
            className="md:hidden p-2.5 rounded-xl hover:bg-white/80 smooth-transition icon-hover shadow-sm"
            aria-label="Toggle search"
          >
            <Search className="h-5 w-5 text-gray-700" />
          </button>

          {/* Notifications */}
          <button className="p-2.5 rounded-xl hover:bg-white/80 smooth-transition icon-hover relative shadow-sm group">
            <Bell className="h-5 w-5 text-gray-700 group-hover:text-blue-600 smooth-transition" />
            <span className="absolute top-1 right-1 h-5 w-5 bg-linear-to-br from-red-500 to-pink-600 text-white text-xs rounded-full flex items-center justify-center font-semibold shadow-lg animate-pulse">
              3
            </span>
          </button>

          {/* Profile */}
          <div className="flex items-center gap-3 pl-3 border-l border-gray-200/50">
            <div className="hidden md:block text-right">
              <p className="text-sm font-semibold text-gray-900">Admin User</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
            <div className="h-10 w-10 bg-linear-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 smooth-transition icon-hover">
              <User className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile search dropdown */}
      {showSearch && (
        <div className="md:hidden mt-4 animate-fadeIn">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 smooth-transition" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/60 border border-gray-200/50 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 smooth-transition outline-none text-gray-700 placeholder-gray-400"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  );
}