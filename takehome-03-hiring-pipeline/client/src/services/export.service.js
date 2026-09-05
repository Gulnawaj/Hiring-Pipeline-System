import api from './api';

export const exportService = {
  exportCSV: async () => {
    const response = await api.get('/export/csv', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'applications.csv');
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  }
};
