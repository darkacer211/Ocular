import React from 'react';
import { cn } from '../../lib/utils';
import { PaymentStatus, PaymentMode } from '../../types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'paid' | 'partial' | 'unpaid' | 'cancelled' | 'cash' | 'upi' | 'split' | 'neutral' | 'blue';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'neutral',
  size = 'md',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-semibold rounded-full uppercase tracking-wider select-none';

  const variants = {
    paid: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    partial: 'bg-amber-100 text-amber-800 border border-amber-300',
    unpaid: 'bg-rose-100 text-rose-800 border border-rose-300',
    cancelled: 'bg-slate-200 text-slate-700 line-through border border-slate-300',
    cash: 'bg-teal-100 text-teal-800 border border-teal-300',
    upi: 'bg-indigo-100 text-indigo-800 border border-indigo-300',
    split: 'bg-purple-100 text-purple-800 border border-purple-300',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
    blue: 'bg-sky-100 text-sky-800 border border-sky-300',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: PaymentStatus }> = ({ status }) => {
  switch (status) {
    case 'PAID':
      return <Badge variant="paid">PAID</Badge>;
    case 'PARTIAL':
      return <Badge variant="partial">PARTIAL</Badge>;
    case 'UNPAID':
      return <Badge variant="unpaid">UNPAID</Badge>;
    case 'CANCELLED':
      return <Badge variant="cancelled">CANCELLED</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
};

export const ModeBadge: React.FC<{ mode: PaymentMode }> = ({ mode }) => {
  switch (mode) {
    case 'CASH':
      return <Badge variant="cash" size="sm">CASH</Badge>;
    case 'UPI':
      return <Badge variant="upi" size="sm">UPI</Badge>;
    case 'SPLIT':
      return <Badge variant="split" size="sm">CASH + UPI</Badge>;
    default:
      return <Badge variant="neutral" size="sm">{mode}</Badge>;
  }
};
