import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function Card({ children, className, title, subtitle, action }: CardProps) {
  return (
    <div className={cn("bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300", className)}>
      {(title || subtitle || action) && (
        <div className="px-6 py-5 border-b border-gray-100/50 flex items-center justify-between">
          <div>
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mb-6", className)}>{children}</div>;
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("", className)}>{children}</div>;
}

export function StatCard({ 
  title, 
  value, 
  change, 
  icon, 
  changeType = 'positive',
  bgColor = 'bg-blue-50'
}: { 
  title: string; 
  value: string | number; 
  change?: string; 
  icon?: React.ReactNode; 
  changeType?: 'positive' | 'negative' | 'neutral';
  bgColor?: string;
}) {
  const changeColor = {
    positive: 'text-emerald-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  }[changeType];

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          {change && (
            <p className={cn("text-sm font-medium", changeColor)}>
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn("p-3 rounded-xl transition-transform duration-300 group-hover:scale-110", bgColor)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}