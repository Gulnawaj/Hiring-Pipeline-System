import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { applicationsService } from '../services/applications.service';
import PipelineView from '../components/pipeline/PipelineView';
import TimelineHistory from '../components/pipeline/TimelineHistory';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  ArrowLeft,
  Mail,
  User,
  Users,
  Briefcase,
  Plus,
  X,
} from 'lucide-react';

const ApplicationDetails = () => {
  const { applicationId } = useParams();
  const { isRecruiter } = useAuth();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);

  const [interviewersList, setInterviewersList] = useState([]);
  const [selectedInterviewer, setSelectedInterviewer] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const fetchApplicationDetails = async () => {
    try {
      const response =
        await applicationsService.getApplicationById(applicationId);

      setApplication(response.data);
    } catch (err) {
      console.error('Failed to load application details:', err);
      setApplication(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchInterviewersList = async () => {
    if (!isRecruiter) return;

    try {
      const response = await api.get('/auth/interviewers');
      setInterviewersList(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to load interviewers list:', err);
      setInterviewersList([]);
    }
  };

  useEffect(() => {
    fetchApplicationDetails();
    fetchInterviewersList();
  }, [applicationId, isRecruiter]);

  const handleAssignInterviewer = async () => {
    if (!selectedInterviewer || isAssigning) return;

    setIsAssigning(true);

    try {
      await applicationsService.assignInterviewer(applicationId, {
        interviewer_id: selectedInterviewer,
      });

      setSelectedInterviewer('');

      await fetchApplicationDetails();
    } catch (err) {
      console.error('Failed to assign interviewer:', err);

      alert(
        err.response?.data?.error ||
          'Failed to assign interviewer'
      );
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveInterviewer = async (interviewerId) => {
    if (!interviewerId) return;

    try {
      await applicationsService.removeInterviewer(
        applicationId,
        interviewerId
      );

      await fetchApplicationDetails();
    } catch (err) {
      console.error('Failed to remove interviewer:', err);

      alert(
        err.response?.data?.error ||
          'Failed to remove interviewer'
      );
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center p-12 text-slate-500">
        Application not found
      </div>
    );
  }

  /*
   * Backend uses snake_case fields.
   * Some existing frontend components may still expect the older
   * camelCase names, so provide compatibility fields here.
   */
  const currentStage = application.stage
    ? application.stage.charAt(0).toUpperCase() +
      application.stage.slice(1)
    : 'Applied';

  const status =
    Number(application.is_rejected) === 1
      ? 'rejected'
      : 'active';

  const rejectedStage = application.stage_before_rejection
    ? application.stage_before_rejection.charAt(0).toUpperCase() +
      application.stage_before_rejection.slice(1)
    : null;

  const applicationForPipeline = {
    ...application,

    // Backend fields
    id: application.id,

    // Compatibility fields for existing frontend components
    _id: application.id,
    candidateName: application.candidate_name,
    email: application.candidate_email,
    currentStage,
    status,
    rejectedStage,

    job: {
      _id: application.job_opening_id,
      title: application.job_title,
      department: application.job_department,
      status: application.job_status,
    },

    interviewers: application.assigned_interviewers || [],
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">

      {/* Back link */}
      <div>
        <Link
          to={
            isRecruiter
              ? `/jobs/${application.job_opening_id}`
              : '/my-applications'
          }
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to {isRecruiter ? 'Job Details' : 'My Panel'}
        </Link>

        {/* Application header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {application.candidate_name}
            </h1>

            <div className="flex items-center flex-wrap gap-4 mt-2 text-sm text-slate-600">
              <span className="flex items-center">
                <Mail className="w-4 h-4 mr-1.5" />
                {application.candidate_email}
              </span>

              <span className="flex items-center">
                <Briefcase className="w-4 h-4 mr-1.5" />
                Applying for:
                <span className="font-semibold ml-1">
                  {application.job_title || 'Unknown Role'}
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full border ${
                status === 'rejected'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : currentStage === 'Hired'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              {status === 'rejected'
                ? 'Rejected'
                : currentStage}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">

        {/* Left column */}
        <div className="lg:col-span-2 space-y-8">

          <PipelineView
            application={applicationForPipeline}
            onPipelineUpdate={fetchApplicationDetails}
          />

          <TimelineHistory
            applicationId={application.id}
            currentStage={application.stage}
            status={
              Number(application.is_rejected) === 1
                ? 'rejected'
                : 'active'
            }
          />
        </div>

        {/* Right column */}
        <div className="space-y-6">

          {/* Candidate profile */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-slate-500" />
              Candidate Profile
            </h3>

            <div className="space-y-4">

              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Source
                </label>

                <p className="mt-1 text-sm text-slate-900 font-medium">
                  {application.source || 'Direct Applied'}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Applied On
                </label>

                <p className="mt-1 text-sm text-slate-900">
                  {application.created_at
                    ? new Date(
                        application.created_at
                      ).toLocaleDateString()
                    : '—'}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Notes
                </label>

                <div className="mt-1 text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 min-h-[100px]">
                  {application.notes ||
                    'No notes provided for this candidate.'}
                </div>
              </div>

            </div>
          </div>

          {/* Assigned interviewers */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-slate-500" />
              Assigned Interviewers
            </h3>

            {application.assigned_interviewers?.length > 0 ? (
              <ul className="space-y-3">
                {application.assigned_interviewers.map(
                  (interviewer) => (
                    <li
                      key={interviewer.id}
                      className="flex items-center space-x-3 text-sm bg-slate-50 p-2 rounded-md"
                    >
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                        {interviewer.name
                          ?.charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <p className="font-medium text-slate-900">
                          {interviewer.name}
                        </p>

                        <p className="text-xs text-slate-500">
                          {interviewer.email}
                        </p>
                      </div>

                      {isRecruiter && (
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveInterviewer(
                              interviewer.id
                            )
                          }
                          className="ml-auto text-slate-400 hover:text-red-500 p-1"
                          title="Remove interviewer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </li>
                  )
                )}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 italic text-center py-4">
                No interviewers assigned yet.
              </p>
            )}

            {/* Assign interviewer */}
            {isRecruiter && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">
                  Assign Interviewer
                </label>

                <div className="flex gap-2">
                  <select
                    value={selectedInterviewer}
                    onChange={(e) =>
                      setSelectedInterviewer(e.target.value)
                    }
                    className="flex-1 text-sm border-slate-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500"
                    disabled={isAssigning}
                  >
                    <option value="">
                      Select interviewer...
                    </option>

                    {interviewersList.map((interviewer) => (
                      <option
                        key={interviewer.id}
                        value={interviewer.id}
                      >
                        {interviewer.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleAssignInterviewer}
                    disabled={
                      !selectedInterviewer || isAssigning
                    }
                    className="btn btn-primary px-3 py-2 disabled:opacity-50"
                    title="Assign interviewer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetails;