import React, { useEffect, useState } from 'react';
import { applicationsService } from '../services/applications.service';
import { pipelineService } from '../services/pipeline.service';
import { exportService } from '../services/export.service';
import { Link } from 'react-router-dom';
import { Search, Filter, Download, ArrowRight, Layers, XCircle } from 'lucide-react';
import BulkActionResultModal from '../components/applications/BulkActionResultModal';
import { useAuth } from '../context/AuthContext';

const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const { isRecruiter } = useAuth();

  // Selection state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkResults, setBulkResults] = useState(null);

  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    stage: '',
    page: 1,
    limit: 10
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchApplications();
    }, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await applicationsService.getApplications(filters);
      setApplications(response.data.data || []);
      setTotal(response.data.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to fetch applications', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await exportService.exportCSV();
    } catch (err) {
      alert('Export failed');
    }
  };

  const toggleSelection = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === applications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(applications.map(a => a._id)));
    }
  };

  const handleBulkAdvance = async () => {
    if (selectedIds.size === 0) return;
    setBulkProcessing(true);
    try {
      const response = await pipelineService.bulkAdvance({ applicationIds: Array.from(selectedIds) });
      setBulkResults(response.data.results);
      setSelectedIds(new Set());
      fetchApplications();
    } catch (err) {
      alert('Failed to execute bulk advance');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.size === 0) return;
    setBulkProcessing(true);
    try {
      const response = await pipelineService.bulkReject({ applicationIds: Array.from(selectedIds), reason: 'Bulk rejected' });
      setBulkResults(response.data.results);
      setSelectedIds(new Set());
      fetchApplications();
    } catch (err) {
      alert('Failed to execute bulk reject');
    } finally {
      setBulkProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">All Applications</h1>
          <p className="text-slate-500 mt-1">Manage and filter all candidates across jobs</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={handleExport} className="btn btn-secondary flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="card">
        {/* Filters Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 gap-4 w-full">
            <div className="relative flex-1 max-w-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                className="input-field pl-10"
                placeholder="Search by name or email..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              />
            </div>

            <div className="relative w-48">
              <select
                className="input-field pl-10"
                value={filters.stage}
                onChange={(e) => setFilters({ ...filters, stage: e.target.value, page: 1 })}
              >
                <option value="">All Stages</option>
                {STAGES.map(stage => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedIds.size > 0 && isRecruiter && (
            <div className="flex items-center space-x-3 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">
              <span className="text-sm font-medium text-indigo-700 mr-2">{selectedIds.size} selected</span>
              <button
                onClick={handleBulkAdvance}
                disabled={bulkProcessing}
                className="btn bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-100 py-1.5 px-3 text-xs flex items-center disabled:opacity-50"
              >
                <Layers className="w-3.5 h-3.5 mr-1" /> Bulk Advance
              </button>
              <button
                onClick={handleBulkReject}
                disabled={bulkProcessing}
                className="btn bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 py-1.5 px-3 text-xs flex items-center disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5 mr-1" /> Bulk Reject
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr className="bg-white">
                {isRecruiter && (
                  <th className="px-6 py-4 w-10">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={applications.length > 0 && selectedIds.size === applications.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                )}
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Candidate</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Job</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Stage</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Applied Date</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={isRecruiter ? 6 : 5} className="px-6 py-12 text-center text-slate-500">
                    <div className="animate-pulse flex flex-col items-center">
                      <div className="h-4 w-32 bg-slate-200 rounded mb-4"></div>
                      <div className="h-4 w-24 bg-slate-200 rounded"></div>
                    </div>
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={isRecruiter ? 6 : 5} className="px-6 py-12 text-center text-slate-500">
                    No applications found matching your criteria.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app._id} className={`hover:bg-slate-50 transition-colors ${selectedIds.has(app._id) ? 'bg-indigo-50/30' : ''}`}>
                    {isRecruiter && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          checked={selectedIds.has(app._id)}
                          onChange={() => toggleSelection(app._id)}
                        />
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-900">{app.candidateName}</div>
                      <div className="text-xs text-slate-500">{app.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {app.job?.title || 'Unknown Job'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${app.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                          app.currentStage === 'Hired' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                        {app.status === 'rejected' ? 'Rejected' : app.currentStage}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/applications/${app._id}`} className="text-indigo-600 hover:text-indigo-900 flex items-center justify-end">
                        View <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-sm text-slate-700">
            Showing <span className="font-semibold">{total > 0 ? Math.min((filters.page - 1) * filters.limit + 1, total) : 0}</span> to{' '}
            <span className="font-semibold">{Math.min(filters.page * filters.limit, total)}</span> of{' '}
            <span className="font-semibold">{total}</span> results
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => setFilters(f => ({ ...f, page: Math.max(1, f.page - 1) }))}
              disabled={filters.page === 1}
              className="btn btn-secondary py-1 px-3 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
              disabled={filters.page * filters.limit >= total}
              className="btn btn-secondary py-1 px-3 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Results Modal */}
      {bulkResults && (
        <BulkActionResultModal
          results={bulkResults}
          onClose={() => setBulkResults(null)}
        />
      )}
    </div>
  );
};

export default Applications;
