'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Wallet,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const sidebarItems: SidebarItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Attendance', href: '/admin/attendance', icon: UserCheck },
  { name: 'Employees', href: '/admin/employees', icon: Users },
  { name: 'Agent Employees', href: '/admin/agents', icon: ShieldCheck },
  { name: 'Wallet', href: '/admin/wallet', icon: Wallet },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
  { name: 'Role Create', href: "/admin/role-create", icon: UserPlus}

];

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ isCollapsed, onToggleCollapse, isMobile = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  const handleLogout = useCallback(() => {
    // Add logout logic here
    console.log('Logout clicked');
  }, []);

  // Memoize navigation items to prevent unnecessary re-renders
  const navigationItems = useMemo(() => {
    return sidebarItems.map((item) => {
      const Icon = item.icon;
      const isActive = pathname === item.href;
      
      return {
        ...item,
        Icon,
        isActive
      };
    });
  }, [pathname]);

  // Memoize container classes
  const containerClasses = useMemo(() => cn(
    // Container: glassy dark with gradient accent border
    'sidebar-container relative flex flex-col h-screen text-white',
    // Smooth transitions with proper easing
    'transition-all duration-300 ease-in-out will-change-transform',
    'bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950',
    'border-r border-white/10',
    // Width management with transform to prevent layout shifts
    'transform-gpu',
    isCollapsed && !isMobile ? 'w-20' : 'w-64',
    isMobile && 'w-64'
  ), [isCollapsed, isMobile]);

  return (
    <div className={containerClasses}>
      {/* Accent glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-blue-600/20 to-transparent" />
      
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          {/* Brand */}
          <div className={cn(
            'flex items-center gap-3 transition-all duration-300 ease-in-out',
            isCollapsed && !isMobile && 'justify-center w-full'
          )}>
            <div className="relative h-8 w-8 rounded-md bg-linear-to-br from-blue-600 to-indigo-600 ring-1 ring-white/20 shadow-lg shrink-0" />
            <div className={cn(
              'sidebar-text-transition flex flex-col transition-all duration-300 ease-in-out overflow-hidden',
              isCollapsed && !isMobile ? 'opacity-0 max-w-0' : 'opacity-100 max-w-xs'
            )}>
              <span className="text-sm font-semibold tracking-wide whitespace-nowrap">Admin Panel</span>
              <span className="text-[11px] text-white/60 whitespace-nowrap">Hospital Management</span>
            </div>
          </div>

          {/* Controls */}
          {isMobile ? (
            <button
              onClick={onCloseMobile}
              className="p-2 rounded-md hover:bg-white/10 transition-colors duration-200 shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={onToggleCollapse}
              className={cn(
                'p-2 rounded-md hover:bg-white/10 transition-all duration-300 ease-in-out shrink-0',
                isCollapsed && 'opacity-0 pointer-events-none'
              )}
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Toggle button for collapsed state - positioned in middle with glassmorphism */}
      {!isMobile && (
        <button
          onClick={onToggleCollapse}
          className={cn(
            'absolute top-1/5 -translate-y-1/2 z-50',
            // Position: more towards the dashboard side
            isCollapsed ? 'right-0 translate-x-6/4' : 'right-0 translate-x-full',
            'w-10 h-10 rounded-full overflow-hidden',
            // Glassmorphism base
            'bg-white/10 backdrop-blur-md border border-white/20',
            // Liquid gradient overlay
            'before:absolute before:inset-0 before:rounded-full',
            'before:bg-linear-to-br before:from-blue-400/30 before:via-indigo-500/20 before:to-purple-600/30',
            'before:transition-all before:duration-500 before:ease-out',
            // Liquid animation on hover
            'hover:before:from-blue-300/40 hover:before:via-indigo-400/30 hover:before:to-purple-500/40',
            'hover:before:animate-pulse',
            // Glass reflection effect
            'after:absolute after:inset-px after:rounded-full',
            'after:bg-linear-to-br after:from-white/20 after:via-transparent after:to-transparent',
            'after:opacity-60',
            // Shadow and glow effects
            'shadow-lg hover:shadow-xl hover:shadow-blue-500/25',
            'ring-1 ring-white/30 hover:ring-white/50',
            // Text and positioning
            'flex items-center justify-center text-white relative',
            'transition-all duration-500 ease-out transform-gpu',
            // Liquid morphing on hover
            'hover:scale-110 hover:rotate-3',
            // Breathing animation
            'animate-pulse-slow',
            isCollapsed ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none scale-75'
          )}
          title="Expand sidebar"
          style={{
            // Custom CSS for liquid effect
            background: `
              radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 70% 70%, rgba(139, 92, 246, 0.2) 0%, transparent 50%),
              linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)
            `,
            backdropFilter: 'blur(12px) saturate(1.2)',
            WebkitBackdropFilter: 'blur(12px) saturate(1.2)',
          }}
        >
          <ChevronRight className={cn(
            'h-4 w-4 relative z-10 transition-all duration-300',
            'drop-shadow-sm hover:drop-shadow-md'
          )} />
          
          {/* Liquid ripple effect */}
          <div className={cn(
            'absolute inset-0 rounded-full opacity-0',
            'bg-linear-to-br from-blue-400/20 to-purple-600/20',
            'transition-all duration-700 ease-out',
            'hover:opacity-100 hover:scale-150'
          )} />
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3">
        <ul className="space-y-2.5">
          {navigationItems.map((item) => {
            const { Icon, isActive, name, href } = item;
            
            return (
              <li key={name}>
                <Link
                  href={href}
                  className={cn(
                    // Base pill with optimized transitions
                    'group relative flex items-center gap-3 px-3 py-3 rounded-md',
                    'text-white/90 hover:text-white',
                    'transition-all duration-200 ease-in-out',
                    // Hover state with better performance
                    'hover:bg-white/5 hover:shadow-sm',
                    // Active state with smooth transitions
                    isActive && 'bg-blue-600/15 ring-1 ring-blue-500/40 text-white shadow-md',
                  )}
                  title={isCollapsed ? name : undefined}
                >
                  {/* Active indicator with smooth appearance */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-blue-500 transition-all duration-200" />
                  )}
                  
                  {/* Icon with consistent sizing */}
                  <Icon className={cn(
                    'h-5 w-5 shrink-0 transition-colors duration-200',
                    isActive ? 'text-blue-400' : 'text-white/70 group-hover:text-white/90'
                  )} />
                  
                  {/* Label with smooth transitions */}
                  <span className={cn(
                    'sidebar-text-transition font-medium tracking-wide text-sm transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap',
                    isCollapsed && !isMobile ? 'opacity-0 max-w-0' : 'opacity-100 max-w-none'
                  )}>
                    {name}
                  </span>
                  
                  {/* Optimized tooltip for collapsed state */}
                  {isCollapsed && !isMobile && (
                    <span className={cn(
                      'sidebar-tooltip pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md',
                      'bg-gray-900 px-2 py-1 text-xs text-white/90 shadow-lg ring-1 ring-white/10',
                      'opacity-0 transition-opacity duration-200 ease-in-out',
                      'group-hover:opacity-100 z-50'
                    )}>
                      {name}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className={cn(
            'group relative flex items-center gap-3 px-3 py-2 w-full rounded-md',
            'text-red-400 hover:text-white',
            'bg-white/0 hover:bg-red-600/20',
            'ring-1 ring-red-500/20 hover:ring-red-500/40',
            'transition-all duration-200 ease-in-out'
          )}
          title={isCollapsed ? 'Logout' : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className={cn(
            'sidebar-text-transition font-medium tracking-wide text-sm transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap',
            isCollapsed && !isMobile ? 'opacity-0 max-w-0' : 'opacity-100 max-w-none'
          )}>
            Logout
          </span>
          {isCollapsed && !isMobile && (
            <span className={cn(
              'sidebar-tooltip pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md',
              'bg-gray-900 px-2 py-1 text-xs text-white/90 shadow-lg ring-1 ring-white/10',
              'opacity-0 transition-opacity duration-200 ease-in-out',
              'group-hover:opacity-100 z-50'
            )}>
              Logout
            </span>
          )}
        </button>
      </div>
    </div>
  );
}