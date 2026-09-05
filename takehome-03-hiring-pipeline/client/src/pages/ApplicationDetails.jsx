import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { applicationsService } from '../services/applications.service';
import PipelineView from '../components/pipeline/PipelineView';
import TimelineHistory from '../components/pipeline/TimelineHistory';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Mail, FileText, User, Users } from 'lucide-react';

const ApplicationDetails = () => {
  const { applicationId } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isRecruiter } = useAuth();
  
  // Note: For simplicity in this implementation, we are fetching assigned interviewers directly if needed,
  // but let's assume the backend populates them or we just show a placeholder list since 
  // managing interviewers isn't fully detailed in the current component context. 
  // Real implementation would have a recruiter panel here to add/remove interviewers.

  const fetchApplicationDetails = async () => {
    try {
      const response = await applicationsService.getApplicationById(applicationId);
      setApplication(response.data);
    } catch (err) {
      console.error('Failed to load application details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicationDetails();
  }, [applicationId]);

  if (loading) {
    return (
      <div className="p-12 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!application) {
    return <div className="text-center p-12 text-slate-500">Application not found</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header & Back Link */}
      <div>
        <Link 
          to={isRecruiter ? `/jobs/${application.job?._id}` : "/my-applications"} 
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to {isRecruiter ? 'Job Details' : 'My Panel'}
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{application.candidateName}</h1>
            <div className="flex items-center space-x-4 mt-2 text-sm text-slate-600">
              <span className="flex items-center"><Mail className="w-4 h-4 mr-1.5" /> {application.email}</span>
              <span className="flex items-center"><Briefcase className="w-4 h-4 mr-1.5" /> Applying for: <span className="font-semibold ml-1">{application.job?.title || 'Unknown Role'}</span></span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 text-sm font-medium rounded-full border ${
              application.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
              application.currentStage === 'Hired' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              'bg-blue-50 text-blue-700 border-blue-200'
            }`}>
              {application.status === 'rejected' ? 'Rejected' : 'Active'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Left Column: Pipeline & History */}
        <div className="lg:col-span-2 space-y-8">
          <PipelineView application={application} onPipelineUpdate={fetchApplicationDetails} />
          <TimelineHistory applicationId={application._id} currentStage={application.currentStage} status={application.status} />
        </div>

        {/* Right Column: Candidate Info & Interviewers */}
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-slate-500" />
              Candidate Profile
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Source</label>
                <p className="mt-1 text-sm text-slate-900 font-medium">{application.source || 'Direct Applied'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Applied On</label>
                <p className="mt-1 text-sm text-slate-900">{new Date(application.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Notes</label>
                <div className="mt-1 text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 min-h-[100px]">
                  {application.notes || 'No notes provided for this candidate.'}
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-slate-500" />
              Assigned Interviewers
            </h3>
            
            {application.interviewers?.length > 0 ? (
              <ul className="space-y-3">
                {application.interviewers.map(interviewer => (
                  <li key={interviewer._id} className="flex items-center space-x-3 text-sm bg-slate-50 p-2 rounded-md">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      {interviewer.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{interviewer.name}</p>
                      <p className="text-xs text-slate-500">{interviewer.email}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 italic text-center py-4">No interviewers assigned yet.</p>
            )}
            
            {isRecruiter && (
              <button className="mt-4 w-full btn btn-secondary text-indigo-600 border-indigo-200">
                Manage Interviewers
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple Mock component missing from lucide for consistency
function Briefcase(props) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
}

export default ApplicationDetails;
