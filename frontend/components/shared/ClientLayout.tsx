'use client';

import { usePathname } from 'next/navigation';
import Navbar from '../layout/Navbar';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin-dashboard');
  const isReceptionRoute = pathname?.startsWith('/reception-dashboard');
  const isAuthRoute = pathname?.startsWith('/auth');

  return (
    <>
      {/* Show navbar only for regular pages (not admin, reception, or auth) */}
      {!isAdminRoute && !isReceptionRoute && <Navbar />}
      
      {/* Content wrapper: add top padding for regular pages, none for auth, admin, or reception */}
      <div className={isAdminRoute || isAuthRoute || isReceptionRoute ? "" : "pt-20"}>
        {children}
      </div>
    </>
  );
}