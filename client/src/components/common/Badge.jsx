import React from 'react';

const Badge = ({ children, variant = 'default', className = '' }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'danger':
      case 'rejected':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'warning':
      case 'archived':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'info':
      case 'open':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'default':
      case 'closed':
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border inline-flex items-center ${getVariantStyles()} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
