import React, { useEffect, useState } from 'react';
import { alertsService } from '../services/alerts.service';
import { Link } from 'react-router-dom';
import { AlertCircle, X, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const formatStage = (stage) => {
  if (!stage) return '—';

  const value = String(stage).toLowerCase();

  return value.charAt(0).toUpperCase() + value.slice(1);
};

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { isRecruiter } = useAuth();

  const fetchAlerts = async () => {
    if (!isRecruiter) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await alertsService.getAlerts();

      setAlerts(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);

      setAlerts([]);
      setError(
        err.response?.data?.error ||
          'Failed to load stalled application alerts.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [isRecruiter]);

  const handleDismiss = async (id) => {
    if (!id) return;

    try {
      await alertsService.dismissAlert(id);

      setAlerts((currentAlerts) =>
        currentAlerts.filter((alert) => alert.id !== id)
      );
    } catch (err) {
      console.error('Failed to dismiss alert:', err);

      alert(
        err.response?.data?.error ||
          'Failed to dismiss alert'
      );
    }
  };

  if (!isRecruiter) {
    return (
      <div className="p-12 text-center text-slate-500">
        Stalled application alerts are available only to recruiters.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-rose-100 text-rose-600 rounded-lg">
          <AlertCircle className="w-6 h-6" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Stalled Applications
          </h1>

          <p className="text-slate-500 mt-1">
            Candidates in the same stage for more than 10 days
          </p>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600" />
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h3 className="text-lg font-medium text-slate-900">
              No stalled applications
            </h3>

            <p className="text-slate-500 mt-1">
              All your candidates are moving smoothly through the pipeline.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {alerts.map((app) => {
              const daysStalled =
                Number.isFinite(Number(app.days_in_stage))
                  ? Number(app.days_in_stage)
                  : 0;

              return (
                <div
                  key={app.id}
                  className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start mb-4 sm:mb-0">
                    <div className="mt-1 mr-4 bg-amber-100 text-amber-600 p-2 rounded-full">
                      <Clock className="w-5 h-5" />
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {app.candidate_name || 'Unknown Candidate'}
                      </h3>

                      <div className="text-sm text-slate-600 mt-1">
                        Applied for{' '}
                        <span className="font-medium">
                          {app.job_title || 'Unknown Job'}
                        </span>
                      </div>

                      <div className="flex items-center mt-2 space-x-2">
                        <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                          Stage: {formatStage(app.stage)}
                        </span>

                        <span className="px-2.5 py-1 text-xs font-medium bg-rose-100 text-rose-700 rounded-md border border-rose-200">
                          Stalled {daysStalled} days
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 sm:ml-4">
                    <Link
                      to={`/applications/${app.id}`}
                      className="btn btn-secondary text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                    >
                      View Application
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDismiss(app.id)}
                      className="btn bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                      title="Dismiss Alert"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Dismiss
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;