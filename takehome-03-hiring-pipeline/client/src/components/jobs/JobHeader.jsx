import React from 'react';
import Badge from '../common/Badge';
import { Briefcase, MapPin, Calendar, Edit, Archive, PlayCircle, Lock, Unlock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const JobHeader = ({ job, onEdit, onArchive, onRestore, onToggleStatus }) => {
  const { isRecruiter } = useAuth();
  const isArchived = job.status === 'archived';

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Briefcase className="w-6 h-6 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
            <Badge variant={job.status}>{job.status}</Badge>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1.5 text-slate-400" />
              {job.department}
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1.5 text-slate-400" />
              Created {new Date(job.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {isRecruiter && (
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={onEdit}
              className="btn bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center"
            >
              <Edit className="w-4 h-4 mr-1.5" /> Edit
            </button>
            
            {!isArchived && (
              <button
                onClick={onToggleStatus}
                className="btn bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center"
              >
                {job.status === 'open' ? (
                  <><Lock className="w-4 h-4 mr-1.5" /> Close Job</>
                ) : (
                  <><Unlock className="w-4 h-4 mr-1.5" /> Reopen Job</>
                )}
              </button>
            )}

            {isArchived ? (
              <button 
                onClick={onRestore}
                className="btn bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 flex items-center"
              >
                <PlayCircle className="w-4 h-4 mr-1.5" /> Restore
              </button>
            ) : (
              <button 
                onClick={onArchive}
                className="btn bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 flex items-center"
              >
                <Archive className="w-4 h-4 mr-1.5" /> Archive
              </button>
            )}
          </div>
        )}
      </div>
      
      {job.description && (
        <div className="mt-6 pt-6 border-t border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900 mb-2">Description</h3>
          <p className="text-sm text-slate-600 whitespace-pre-line">{job.description}</p>
        </div>
      )}
    </div>
  );
};

export default JobHeader;
