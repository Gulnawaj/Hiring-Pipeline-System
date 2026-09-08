import React, { useState } from 'react';
import { X } from 'lucide-react';

const ApplicationForm = ({ initialData, jobId, onSubmit, onClose, isSubmitting }) => {
  const [formData, setFormData] = useState({
    candidateName: initialData?.candidateName || '',
    email: initialData?.email || '',
    source: initialData?.source || 'Direct',
    notes: initialData?.notes || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, jobId });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">
            {initialData ? 'Edit Application' : 'Add Candidate'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Candidate Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="candidateName"
              required
              className="input-field p-2.5"
              value={formData.candidateName}
              onChange={handleChange}
              placeholder="e.g. Jane Doe"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email <span className="text-red-500">*</span></label>
            <input
              type="email"
              name="email"
              required
              className="input-field p-2.5"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. jane@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Source</label>
            <select
              name="source"
              className="input-field p-2.5"
              value={formData.source}
              onChange={handleChange}
            >
              <option value="Direct">Direct</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Referral">Referral</option>
              <option value="Agency">Agency</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              name="notes"
              rows={3}
              className="input-field p-2.5 resize-none"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Initial screening notes, etc."
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.candidateName || !formData.email}
              className="btn btn-primary"
            >
              {isSubmitting ? 'Saving...' : 'Save Candidate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationForm;
