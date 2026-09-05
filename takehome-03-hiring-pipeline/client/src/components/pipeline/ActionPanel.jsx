import React from 'react';
import { ArrowRight, XCircle, RotateCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'];

const ActionPanel = ({ currentStage, status, rejectedStage, onAdvance, onReject, onReinstate, isProcessing }) => {
  const { isRecruiter } = useAuth();

  // If the user is not a recruiter, they cannot see or use the action panel.
  if (!isRecruiter) return null;

  const isRejected = status === 'rejected';
  const currentIndex = STAGES.indexOf(currentStage);
  const nextStage = currentIndex < STAGES.length - 1 ? STAGES[currentIndex + 1] : null;
  const isHired = currentStage === 'Hired' && !isRejected;

  return (
    <div className="bg-slate-50 p-4 border-t border-slate-200 rounded-b-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="text-sm text-slate-600">
        {isRejected ? (
          <p>Candidate was rejected at the <span className="font-semibold text-slate-900">{rejectedStage || currentStage}</span> stage.</p>
        ) : isHired ? (
          <p className="text-emerald-600 font-medium">Candidate has been successfully hired!</p>
        ) : (
          <p>Current stage: <span className="font-semibold text-slate-900">{currentStage}</span></p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {isRejected ? (
          <button 
            onClick={onReinstate}
            disabled={isProcessing}
            className="btn btn-secondary flex items-center border-slate-300 text-slate-700 disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reinstate to {rejectedStage || currentStage}
          </button>
        ) : (
          <>
            {!isHired && (
              <button 
                onClick={onReject}
                disabled={isProcessing}
                className="btn bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 disabled:opacity-50 flex items-center"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject Candidate
              </button>
            )}
            
            {nextStage && !isHired && (
              <button 
                onClick={onAdvance}
                disabled={isProcessing}
                className="btn btn-primary flex items-center disabled:opacity-50"
              >
                Advance to {nextStage}
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ActionPanel;
