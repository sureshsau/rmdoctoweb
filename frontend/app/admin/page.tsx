'use client';

import { useEffect } from 'react';
import { redirect } from 'next/navigation';

export default function AdminPage() {
  useEffect(() => {
    redirect('/admin/dashboard');
  }, []);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}