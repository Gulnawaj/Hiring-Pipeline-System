import React from 'react';
import { CheckCircle2, Circle, XCircle, Clock } from 'lucide-react';

const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'];

const StageStepper = ({ currentStage, status, rejectedStage }) => {
  const getStageIndex = (stage) => STAGES.indexOf(stage);
  
  const currentIndex = getStageIndex(currentStage);
  const isRejected = status === 'rejected';
  
  // If rejected, determine where they were rejected. If we don't have rejectedStage, use currentStage.
  const failIndex = isRejected ? getStageIndex(rejectedStage || currentStage) : -1;

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative">
        {/* Background connecting line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 z-0"></div>
        
        {/* Active connecting line */}
        <div
          className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 z-0 transition-all duration-500 ${isRejected ? 'bg-rose-500' : 'bg-indigo-600'}`}
          style={{ width: `${Math.max(0, (isRejected ? failIndex : currentIndex) / (STAGES.length - 1)) * 100}%` }}
        ></div>

        {STAGES.map((stage, index) => {
          const isCompleted = index < currentIndex && !isRejected;
          const isActive = index === currentIndex && !isRejected;
          const isFailedHere = isRejected && index === failIndex;
          const isPastFail = isRejected && index > failIndex;
          
          let Icon = Circle;
          let iconColor = "text-slate-300";
          let bgColor = "bg-white";
          let textColor = "text-slate-500";

          if (isCompleted) {
            Icon = CheckCircle2;
            iconColor = "text-indigo-600";
            bgColor = "bg-white";
            textColor = "text-indigo-700 font-medium";
          } else if (isActive) {
            Icon = Clock;
            iconColor = "text-indigo-600";
            bgColor = "bg-indigo-50 border-2 border-indigo-600";
            textColor = "text-indigo-700 font-bold";
          } else if (isFailedHere) {
            Icon = XCircle;
            iconColor = "text-rose-600";
            bgColor = "bg-rose-50 border-2 border-rose-600";
            textColor = "text-rose-700 font-bold";
          } else if (isPastFail) {
            Icon = Circle;
            iconColor = "text-slate-200";
            bgColor = "bg-slate-50";
            textColor = "text-slate-400 opacity-50";
          } else if (index < currentIndex && isRejected) {
             // Completed before failure
             Icon = CheckCircle2;
             iconColor = "text-slate-400";
             bgColor = "bg-white";
             textColor = "text-slate-500 line-through";
          }

          return (
            <div key={stage} className="relative z-10 flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bgColor} ${!isActive && !isFailedHere ? 'border border-slate-200' : ''}`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
              </div>
              <span className={`mt-3 text-sm ${textColor} text-center absolute top-10 w-24 -ml-12 left-1/2`}>
                {stage}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StageStepper;
