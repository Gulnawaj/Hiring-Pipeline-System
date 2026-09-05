import React from 'react';
import { X, CheckCircle2, XCircle } from 'lucide-react';

const BulkActionResultModal = ({ results, onClose }) => {
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Bulk Action Results</h2>
            <p className="text-sm text-slate-500 mt-1">
              {successCount} succeeded, {failureCount} refused.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <ul className="space-y-3">
            {results.map((result, index) => (
              <li 
                key={index} 
                className={`p-4 rounded-lg border ${
                  result.success ? 'bg-white border-emerald-200' : 'bg-white border-rose-200'
                } shadow-sm flex items-start`}
              >
                <div className="mt-0.5 shrink-0">
                  {result.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-500" />
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-slate-900">
                      {result.candidateName || `Candidate ID: ${result.applicationId}`}
                    </span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      result.success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {result.success ? 'Success' : 'Refused'}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 ${result.success ? 'text-slate-600' : 'text-rose-600 font-medium'}`}>
                    {result.message}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-6 border-t border-slate-100 shrink-0 flex justify-end bg-white">
          <button onClick={onClose} className="btn btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionResultModal;
