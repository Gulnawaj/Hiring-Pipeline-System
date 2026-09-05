import api from './api';

export const applicationsService = {
  getApplications: (params) => api.get('/applications', { params }),
  getAssignedApplications: () => api.get('/applications/assigned'),
  getApplicationById: (id) => api.get(`/applications/${id}`),
  createApplication: (data) => api.post('/applications', data),
  updateApplication: (id, data) => api.put(`/applications/${id}`, data),
  assignInterviewer: (id, data) => api.post(`/applications/${id}/interviewers`, data),
  removeInterviewer: (id, interviewerId) => api.delete(`/applications/${id}/interviewers/${interviewerId}`)
};
