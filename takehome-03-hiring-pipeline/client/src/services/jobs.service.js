import api from './api';

export const jobsService = {
  getJobs: (params = {}) => api.get('/jobs', { params }),
  getJobById: (id) => api.get(`/jobs/${id}`),
  createJob: (data) => api.post('/jobs', data),
  updateJob: (id, data) => api.put(`/jobs/${id}`, data),
  archiveJob: (id) => api.post(`/jobs/${id}/archive`),
  restoreJob: (id) => api.post(`/jobs/${id}/restore`)
};