import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function Card({ children, className, title, subtitle, action }: CardProps) {
  return (
    <div className={cn("bg-card text-card-foreground rounded-lg border", className)}>
      {(title || subtitle || action) && (
        <div className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              {title && <h3 className="text-lg font-semibold">{title}</h3>}
              {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
            </div>
            {action && <div>{action}</div>}
          </div>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
}

export function StatCard({ title, value, change, changeType, icon }: StatCardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      case 'neutral':
        return 'text-muted-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="bg-card text-card-foreground rounded-lg border p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          <p className={cn("text-sm", getChangeColor())}>
            {change}
          </p>
        </div>
        {icon && (
          <div className="p-2 bg-muted rounded-lg">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}