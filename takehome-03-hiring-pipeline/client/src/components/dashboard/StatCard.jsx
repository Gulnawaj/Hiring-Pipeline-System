import React from 'react';
import Card from '../common/Card';

const StatCard = ({ title, value, icon: Icon, colorClass }) => {
  return (
    <Card noPadding={true}>
      <div className="p-6 flex items-center">
        <div className={`p-4 rounded-xl ${colorClass}`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        <div className="ml-6">
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</h3>
          <div className="mt-1 flex items-baseline">
            <p className="text-3xl font-bold text-slate-900">{value}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default StatCard;
