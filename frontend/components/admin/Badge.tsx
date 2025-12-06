import React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'default';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-gray-100/80 text-gray-800 border border-gray-200',
  success: 'bg-emerald-100/80 text-emerald-800 border border-emerald-200',
  danger: 'bg-red-100/80 text-red-800 border border-red-200',
  warning: 'bg-amber-100/80 text-amber-800 border border-amber-200',
  info: 'bg-blue-100/80 text-blue-800 border border-blue-200',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm shadow-sm transition-all duration-200 hover:scale-105',
        badgeVariants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// Status specific badges for convenience
export function StatusBadge({ status }: { status: 'Present' | 'Absent' | 'Late' | 'Active' | 'Inactive' }) {
  const variant = {
    Present: 'success',
    Active: 'success',
    Absent: 'danger',
    Inactive: 'danger',
    Late: 'warning',
  }[status] as BadgeVariant;

  return <Badge variant={variant}>{status}</Badge>;
}