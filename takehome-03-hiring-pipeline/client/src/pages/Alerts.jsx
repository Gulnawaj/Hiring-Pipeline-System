import React, { useEffect, useState } from 'react';
import { alertsService } from '../services/alerts.service';
import { Link } from 'react-router-dom';
import { AlertCircle, X, Clock } from 'lucide-react';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await alertsService.getAlerts();
      setAlerts(response.data);
    } catch (err) {
      console.error('Failed to fetch alerts', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (id) => {
    try {
      await alertsService.dismissAlert(id);
      // Remove from local state
      setAlerts(alerts.filter(a => a._id !== id));
    } catch (err) {
      alert('Failed to dismiss alert');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-rose-100 text-rose-600 rounded-lg">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Stalled Applications</h1>
          <p className="text-slate-500 mt-1">Candidates in the same stage for more than 10 days</p>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900">No stalled applications</h3>
            <p className="text-slate-500 mt-1">All your candidates are moving smoothly through the pipeline.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {alerts.map(app => {
              const daysStalled = Math.floor((new Date() - new Date(app.stageUpdatedAt)) / (1000 * 60 * 60 * 24));
              
              return (
                <div key={app._id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-start mb-4 sm:mb-0">
                    <div className="mt-1 mr-4 bg-amber-100 text-amber-600 p-2 rounded-full">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{app.candidateName}</h3>
                      <div className="text-sm text-slate-600 mt-1">
                        Applied for <span className="font-medium">{app.job?.title || 'Unknown Job'}</span>
                      </div>
                      <div className="flex items-center mt-2 space-x-2">
                        <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                          Stage: {app.currentStage}
                        </span>
                        <span className="px-2.5 py-1 text-xs font-medium bg-rose-100 text-rose-700 rounded-md border border-rose-200">
                          Stalled {daysStalled} days
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 sm:ml-4">
                    <Link to={`/applications/${app._id}`} className="btn btn-secondary text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                      View Application
                    </Link>
                    <button 
                      onClick={() => handleDismiss(app._id)}
                      className="btn bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                      title="Dismiss Alert"
                    >
                      <X className="w-4 h-4 mr-1" /> Dismiss
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
