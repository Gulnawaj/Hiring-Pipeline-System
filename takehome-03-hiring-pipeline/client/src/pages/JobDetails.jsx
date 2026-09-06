import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  const { isRecruiter } = useAuth();

  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isAppFormOpen, setIsAppFormOpen] = useState(false);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchJobData = async () => {
    if (!jobId) return;

    setLoading(true);

    try {
      const [jobRes, appsRes] = await Promise.all([
        jobsService.getJobById(jobId),
        applicationsService.getApplications({
          job_opening_id: jobId,
          limit: 100,
        }),
      ]);

      // Job API response
      setJob(jobRes.data);

      // Applications API response:
      // {
      //   data: [...],
      //   pagination: {...}
      // }
      const applicationData = Array.isArray(appsRes?.data?.data)
        ? appsRes.data.data
        : [];

      setApplications(applicationData);
    } catch (err) {
      console.error('Failed to load job details:', err);
      setJob(null);
      setApplications([]);
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
      const response = await jobsService.updateJob(jobId, data);

      setJob((currentJob) => ({
        ...currentJob,
        ...(response?.data || data),
      }));

      setIsEditFormOpen(false);
    } catch (err) {
      console.error('Failed to update job:', err);
      alert(err.response?.data?.error || 'Failed to update job');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchiveJob = async () => {
    setIsProcessing(true);

    try {
      await jobsService.archiveJob(jobId);
      setIsArchiveConfirmOpen(false);
      await fetchJobData();
    } catch (err) {
      console.error('Failed to archive job:', err);
      alert(err.response?.data?.error || 'Failed to archive job');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreJob = async () => {
    setIsProcessing(true);

    try {
      await jobsService.restoreJob(jobId);
      await fetchJobData();
    } catch (err) {
      console.error('Failed to restore job:', err);
      alert(err.response?.data?.error || 'Failed to restore job');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!job || isProcessing || job.status === 'archived') return;

    const currentStatus = String(job.status || '').toLowerCase();
    const newStatus = currentStatus === 'open' ? 'closed' : 'open';

    setIsProcessing(true);

    try {
      const response = await jobsService.updateJob(jobId, {
        title: job.title,
        department: job.department,
        description: job.description,
        status: newStatus,
      });

      setJob((currentJob) => ({
        ...currentJob,
        ...(response?.data || {}),
        status: response?.data?.status || newStatus,
      }));
    } catch (err) {
      console.error('Failed to update job status:', err);
      alert(err.response?.data?.error || 'Failed to update job status');
    } finally {
      setIsProcessing(false);
    }
  };

const handleCreateApplication = async (data) => {
  setIsProcessing(true);

  try {
    await applicationsService.createApplication({
      job_opening_id: jobId,
      candidate_name: data.candidate_name || data.candidateName,
      candidate_email: data.candidate_email || data.email,
      source: data.source,
      notes: data.notes || '',
    });

    setIsAppFormOpen(false);
    await fetchJobData();
  } catch (err) {
    console.error('Failed to create application:', err);
    alert(
      err.response?.data?.error || 'Failed to add candidate'
    );
  } finally {
    setIsProcessing(false);
  }
};

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!job) {
    return (
      <EmptyState
        title="Job not found"
        message="The requested job opening could not be found."
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Back */}
      <Link
        to="/jobs"
        className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Jobs
      </Link>

      {/* Job Header */}
      <JobHeader
        job={job}
        onEdit={() => setIsEditFormOpen(true)}
        onArchive={() => setIsArchiveConfirmOpen(true)}
        onRestore={handleRestoreJob}
        onToggleStatus={handleToggleStatus}
      />

      {/* Applications */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center">
            <Users className="w-5 h-5 mr-2 text-indigo-500" />
            Candidates ({applications.length})
          </h2>

          {isRecruiter && (
            <button
              type="button"
              onClick={() => setIsAppFormOpen(true)}
              className="btn btn-primary text-sm py-1.5 px-3"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Candidate
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
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Candidate
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Source
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Stage
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-slate-100">
                  {applications.map((app) => {
                    const isRejected = Number(app.is_rejected) === 1;
                    const stageLabel = isRejected
                      ? 'Rejected'
                      : app.stage
                        ? app.stage.charAt(0).toUpperCase() + app.stage.slice(1)
                        : 'Unknown';

                    return (
                      <tr
                        key={app.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        {/* Candidate */}
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-slate-900">
                            {app.candidate_name}
                          </div>

                          <div className="text-xs text-slate-500">
                            {app.candidate_email}
                          </div>
                        </td>

                        {/* Source */}
                        <td className="px-6 py-4 text-sm text-slate-700">
                          {app.source || '—'}
                        </td>

                        {/* Stage */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant={
                              isRejected
                                ? 'rejected'
                                : app.stage === 'hired'
                                  ? 'success'
                                  : 'info'
                            }
                          >
                            {stageLabel}
                          </Badge>
                        </td>

                        {/* Action */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            to={`/applications/${app.id}`}
                            className="text-indigo-600 hover:text-indigo-900 inline-flex items-center justify-end"
                          >
                            View
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Job Modal */}
      {isEditFormOpen && (
        <JobForm
          isOpen={true}
          onClose={() => setIsEditFormOpen(false)}
          initialData={job}
          onSubmit={handleUpdateJob}
          isSubmitting={isProcessing}
        />
      )}

      {/* Create Application Modal */}
      {isAppFormOpen && (
        <ApplicationForm
          jobId={jobId}
          onClose={() => setIsAppFormOpen(false)}
          onSubmit={handleCreateApplication}
          isSubmitting={isProcessing}
        />
      )}

      {/* Archive Confirmation */}
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