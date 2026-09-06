import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { jobsService } from '../services/jobs.service';
import { Plus, Briefcase, MapPin, Search } from 'lucide-react';
import JobForm from '../components/jobs/JobForm';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { isRecruiter } = useAuth();
  
  // Create Job Modal state
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, [showArchived]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await jobsService.getJobs();
      let data = response.data;
      if (!showArchived) {
        data = data.filter(job => job.status !== 'archived');
      }
      setJobs(data);
    } catch (err) {
      console.error('Failed to load jobs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (data) => {
    setIsProcessing(true);
    try {
      await jobsService.createJob(data);
      setIsCreateFormOpen(false);
      fetchJobs(); // Refresh list
    } catch (err) {
      alert('Failed to create job');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Job Openings</h1>
          <p className="text-slate-500 mt-1">Manage your active and past job postings</p>
        </div>
        {isRecruiter && (
          <button 
            onClick={() => setIsCreateFormOpen(true)}
            className="btn btn-primary whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Job
          </button>
        )}
      </div>

      <div className="card">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              className="input-field pl-10"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <label className="flex items-center space-x-2 text-sm text-slate-600 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Show archived</span>
          </label>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr className="bg-white">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {jobs.filter(job => {
                  const term = searchTerm.trim().toLowerCase();
                  if (!term) return true;
                  return job.title.toLowerCase().includes(term);
                }).map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="bg-indigo-50 p-2 rounded-lg mr-4 group-hover:bg-indigo-100 transition-colors">
                          <Briefcase className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <Link to={`/jobs/${job.id}`} className="text-sm font-semibold text-indigo-600 hover:text-indigo-900">
                            {job.title}
                          </Link>
                          <div className="text-xs text-slate-500 mt-1">{new Date(job.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-700 flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {job.department}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={job.status === 'archived' ? 'archived' : (job.status === 'closed' ? 'closed' : 'success')}>
                        {job.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/jobs/${job.id}`} className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded-md hover:bg-indigo-100 transition-colors">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
                {jobs.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-0">
                      <EmptyState title="No job openings found" message="Create your first job opening to start accepting candidates." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isCreateFormOpen && (
        <JobForm 
          isOpen={true} 
          onClose={() => setIsCreateFormOpen(false)}
          onSubmit={handleCreateJob}
          isSubmitting={isProcessing}
        />
      )}
    </div>
  );
};

export default Jobs;
