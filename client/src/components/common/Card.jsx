import React from 'react';

const Card = ({ children, className = '', noPadding = false }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
      {!noPadding ? (
        <div className="p-6">
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
};

export default Card;
