import api from './api';

export const pipelineService = {
  advance: (id) => api.post(`/pipeline/${id}/advance`),
  transition: (id, data) => api.post(`/pipeline/${id}/transition`, data),
  reject: (id, data) => api.post(`/pipeline/${id}/reject`, data),
  reinstate: (id) => api.post(`/pipeline/${id}/reinstate`),
  bulkAdvance: (data) => api.post('/pipeline/bulk-advance', data),
  bulkReject: (data) => api.post('/pipeline/bulk-reject', data)
};
