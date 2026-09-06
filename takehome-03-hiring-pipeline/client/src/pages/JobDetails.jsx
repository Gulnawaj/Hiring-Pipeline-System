import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { jobsService } from '../services/jobs.service';
import { applicationsService } from '../services/applications.service';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Plus, Users, ArrowRight } from 'lucide-react';

import JobHeader from '../components/jobs/JobHeader';
import JobForm from '../components/jobs/JobForm';
import ApplicationForm from '../components/applications/ApplicationForm';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Badge from '../components/common/Badge';

const JobDetails = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { isRecruiter } = useAuth();
  
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isAppFormOpen, setIsAppFormOpen] = useState(false);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchJobData = async () => {
    setLoading(true);
    try {
      const [jobRes, appsRes] = await Promise.all([
        jobsService.getJobById(jobId),
        applicationsService.getApplications({ job: jobId, limit: 100 })
      ]);
      setJob(jobRes.data);
      setApplications(appsRes.data.applications);
    } catch (err) {
      console.error('Failed to load job details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobData();
  }, [jobId]);

  const handleUpdateJob = async (data) => {
    setIsProcessing(true);
    try {
      await jobsService.updateJob(jobId, data);
      setIsEditFormOpen(false);
      fetchJobData();
    } catch (err) {
      alert('Failed to update job');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchiveJob = async () => {
    setIsProcessing(true);
    try {
      await jobsService.archiveJob(jobId);
      setIsArchiveConfirmOpen(false);
      fetchJobData();
    } catch (err) {
      alert('Failed to archive job');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreJob = async () => {
    try {
      await jobsService.restoreJob(jobId);
      fetchJobData();
    } catch (err) {
      alert('Failed to restore job');
    }
  };

  const handleToggleStatus = async () => {
    setIsProcessing(true);
    try {
      const newStatus = job.status === 'open' ? 'closed' : 'open';
      await jobsService.updateJob(jobId, { 
        title: job.title,
        department: job.department,
        description: job.description,
        status: newStatus 
      });
      fetchJobData();
    } catch (err) {
      alert('Failed to update job status');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateApplication = async (data) => {
    setIsProcessing(true);
    try {
      await applicationsService.createApplication(data);
      setIsAppFormOpen(false);
      fetchJobData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add candidate');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!job) return <EmptyState title="Job not found" />;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <Link to="/jobs" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Jobs
      </Link>

      <JobHeader 
        job={job}
        onEdit={() => setIsEditFormOpen(true)}
        onArchive={() => setIsArchiveConfirmOpen(true)}
        onRestore={handleRestoreJob}
        onToggleStatus={handleToggleStatus}
      />

      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center">
            <Users className="w-5 h-5 mr-2 text-indigo-500" />
            Candidates ({applications.length})
          </h2>
          {isRecruiter && (
            <button 
              onClick={() => setIsAppFormOpen(true)}
              className="btn btn-primary text-sm py-1.5 px-3"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Candidate
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {applications.length === 0 ? (
            <EmptyState 
              title="No candidates yet" 
              message="Add a candidate manually or wait for applications to arrive."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Candidate</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Source</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Stage</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {applications.map((app) => (
                    <tr key={app._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-slate-900">{app.candidateName}</div>
                        <div className="text-xs text-slate-500">{app.email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {app.source}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={app.status === 'rejected' ? 'rejected' : (app.currentStage === 'Hired' ? 'success' : 'info')}>
                          {app.status === 'rejected' ? 'Rejected' : app.currentStage}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link to={`/applications/${app._id}`} className="text-indigo-600 hover:text-indigo-900 flex items-center justify-end">
                          View <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {isEditFormOpen && (
        <JobForm 
          isOpen={true} 
          onClose={() => setIsEditFormOpen(false)}
          initialData={job}
          onSubmit={handleUpdateJob}
          isSubmitting={isProcessing}
        />
      )}

      {isAppFormOpen && (
        <ApplicationForm 
          jobId={jobId}
          onClose={() => setIsAppFormOpen(false)}
          onSubmit={handleCreateApplication}
          isSubmitting={isProcessing}
        />
      )}

      <ConfirmDialog 
        isOpen={isArchiveConfirmOpen}
        onClose={() => setIsArchiveConfirmOpen(false)}
        onConfirm={handleArchiveJob}
        title="Archive Job Opening"
        message="Are you sure you want to archive this job? It will be hidden from default views, but existing applications will remain intact."
        confirmText="Archive"
        isDestructive={true}
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default JobDetails;
