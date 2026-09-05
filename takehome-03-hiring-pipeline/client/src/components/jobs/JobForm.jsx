import React, { useState } from 'react';
import Modal from '../common/Modal';

const JobForm = ({ isOpen, onClose, initialData, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    department: initialData?.department || '',
    description: initialData?.description || '',
    status: initialData?.status || 'open'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={initialData ? 'Edit Job Opening' : 'Create Job Opening'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Job Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="title"
              required
              className="input-field p-2.5"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Senior Frontend Engineer"
            />
          </div>
          
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Department <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="department"
              required
              className="input-field p-2.5"
              value={formData.department}
              onChange={handleChange}
              placeholder="e.g. Engineering"
            />
          </div>
        </div>
        
        {initialData && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              name="status"
              className="input-field p-2.5"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            name="description"
            rows={5}
            className="input-field p-2.5 resize-none"
            value={formData.description}
            onChange={handleChange}
            placeholder="Role requirements, responsibilities, etc."
          />
        </div>

        <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 mt-6">
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
            disabled={isSubmitting || !formData.title || !formData.department}
            className="btn btn-primary"
          >
            {isSubmitting ? 'Saving...' : (initialData ? 'Update Job' : 'Create Job')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default JobForm;
