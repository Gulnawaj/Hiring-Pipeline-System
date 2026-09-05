import React from 'react';

const LoadingSpinner = ({ fullPage = false, message = 'Loading...' }) => {
  const spinner = (
    <div className="flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
      {message && <span className="text-sm font-medium text-slate-500">{message}</span>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return (
    <div className="p-12 w-full flex justify-center items-center h-full">
      {spinner}
    </div>
  );
};

export default LoadingSpinner;
