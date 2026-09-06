import React, { useEffect, useState } from 'react';
import { applicationsService } from '../services/applications.service';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const formatStage = (stage) => {
  if (!stage) return '—';

  const value = String(stage).toLowerCase();

  return value.charAt(0).toUpperCase() + value.slice(1);
};

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { isInterviewer } = useAuth();

  useEffect(() => {
    const fetchMyApplications = async () => {
      // This page is specifically for interviewers.
      if (!isInterviewer) {
        setApplications([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        // Backend returns only applications assigned
        // to the currently authenticated interviewer.
        const response =
          await applicationsService.getAssignedApplications();

        const assignedApplications = Array.isArray(response.data)
          ? response.data
          : [];

        setApplications(assignedApplications);
      } catch (err) {
        console.error(
          'Failed to load assigned applications:',
          err
        );

        setApplications([]);
        setError(
          err.response?.data?.error ||
            'Failed to load your assigned applications.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMyApplications();
  }, [isInterviewer]);

  if (!isInterviewer) {
    return (
      <div className="p-12 text-center text-slate-500">
        This page is available only to interviewers.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          My Interview Panel
        </h1>

        <p className="text-slate-500 mt-1">
          Candidates assigned to you for feedback
        </p>
      </div>

      <div className="card">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            You have no assigned candidates at this time.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Candidate
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Job Role
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Current Stage
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {/* Candidate */}
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-900">
                        {app.candidate_name || 'Unknown Candidate'}
                      </div>

                      <div className="text-xs text-slate-500">
                        {app.candidate_email || 'No email'}
                      </div>
                    </td>

                    {/* Job */}
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {app.job_title || 'Unknown Job'}
                    </td>

                    {/* Current stage */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 text-xs font-medium rounded-full border ${
                          Number(app.is_rejected) === 1
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : String(app.stage || '').toLowerCase() ===
                              'hired'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {Number(app.is_rejected) === 1
                          ? 'Rejected'
                          : formatStage(app.stage)}
                      </span>
                    </td>

                    {/* Feedback / Details */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/applications/${app.id}`}
                        className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded-md hover:bg-indigo-100 transition-colors inline-flex items-center"
                      >
                        Provide Feedback
                        <ArrowRight className="w-4 h-4 ml-2" />
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
  );
};

export default MyApplications;