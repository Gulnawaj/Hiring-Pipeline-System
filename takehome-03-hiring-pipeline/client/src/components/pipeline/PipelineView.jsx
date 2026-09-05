import React, { useState } from 'react';
import StageStepper from './StageStepper';
import ActionPanel from './ActionPanel';
import { pipelineService } from '../../services/pipeline.service';

const PipelineView = ({ application, onPipelineUpdate }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleAdvance = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      await pipelineService.advance(application._id);
      onPipelineUpdate();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to advance candidate. Server rejected transition.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      await pipelineService.reject(application._id, { reason: 'Failed interview' });
      onPipelineUpdate();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject candidate.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReinstate = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      await pipelineService.reinstate(application._id);
      onPipelineUpdate();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reinstate candidate.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="card mb-8 shadow-md">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Pipeline Progress</h2>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 font-medium">
                  Server rejected transition: {error}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="px-8 pb-8 pt-4 overflow-x-auto">
          <div className="min-w-[600px]">
            <StageStepper 
              currentStage={application.currentStage} 
              status={application.status}
              rejectedStage={application.rejectedStage}
            />
          </div>
        </div>
      </div>

      <ActionPanel 
        currentStage={application.currentStage}
        status={application.status}
        rejectedStage={application.rejectedStage}
        onAdvance={handleAdvance}
        onReject={handleReject}
        onReinstate={handleReinstate}
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default PipelineView;
