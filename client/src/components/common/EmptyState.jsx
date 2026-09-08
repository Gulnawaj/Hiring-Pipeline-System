import React from 'react';
import { PackageOpen } from 'lucide-react';

const EmptyState = ({ 
  title = 'No Data Found', 
  message = 'There is nothing to display here at the moment.', 
  icon: Icon = PackageOpen,
  actionButton = null 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center h-full w-full">
      <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4 border border-slate-200">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500 mt-2 max-w-sm">
        {message}
      </p>
      {actionButton && (
        <div className="mt-6">
          {actionButton}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
