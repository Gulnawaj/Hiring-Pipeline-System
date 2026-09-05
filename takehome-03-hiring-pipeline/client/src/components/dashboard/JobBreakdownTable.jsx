import React from 'react';
import Card from '../common/Card';

const JobBreakdownTable = ({ data }) => {
  return (
    <Card className="mt-6" noPadding={true}>
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-lg font-semibold text-slate-900">Applications by Job</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead>
            <tr>
              <th className="px-6 py-3 bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Job Title</th>
              <th className="px-6 py-3 bg-slate-50 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Applications</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {data.map((job) => (
              <tr key={job._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{job.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-right font-semibold">{job.count}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan="2" className="px-6 py-8 text-center text-slate-500 text-sm">
                  No applications found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default JobBreakdownTable;
