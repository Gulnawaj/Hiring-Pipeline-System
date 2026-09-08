import api from './api';

export const timelineService = {
  getTimeline: (id) => api.get(`/applications/${id}/timeline`),
  addFeedback: (id, data) => api.post(`/applications/${id}/feedback`, data)
};
