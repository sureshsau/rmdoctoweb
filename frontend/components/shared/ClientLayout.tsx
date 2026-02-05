'use client';

import { usePathname } from 'next/navigation';
import Navbar from '../layout/Navbar';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';

  // Hide navbar on auth pages and any dashboard-like routes.
  // Examples: /auth/*, /admin-dashboard/*, /reception-dashboard/*, /dashboard/*
  const isAuthRoute = pathname.startsWith('/auth');
  const isDashboardRoute = /^\/[^/]*dashboard(\/|$)/.test(pathname);
  const showNavbar = pathname === '/' && !isAuthRoute && !isDashboardRoute;

  return (
    <>
      {/* Navbar is only for landing page */}
      {showNavbar && <Navbar />}
      
      {/* Content wrapper: add top padding only when navbar is shown */}
      <div className={showNavbar ? "pt-20" : ""}>
        {children}
      </div>
    </>
  );
}