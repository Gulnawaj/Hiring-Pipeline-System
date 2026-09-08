import api from './api';

export const alertsService = {
  getAlerts: () => api.get('/alerts'),
  getAlertsCount: () => api.get('/alerts/count'),
  dismissAlert: (id) => api.post(`/alerts/${id}/dismiss`)
};
