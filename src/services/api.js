import axios from 'axios';
import { API_BASE_URL } from '../constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('accessToken');
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const message = error.response?.data?.error || error.message || 'An unexpected error occurred';

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(new Error('Session expired'));
      }

      try {
        const response = await api.post('/auth/refresh', { refreshToken });
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

        localStorage.setItem('accessToken', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(new Error(message));
  }
);

export async function uploadFile(file, onProgress, signal) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    signal,
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded * 100) / event.total));
      }
    },
  });
  return response.data;
}

export async function createCampaign(data) {
  const response = await api.post('/campaigns', data);
  return response.data;
}

export async function getCampaigns() {
  const response = await api.get('/campaigns');
  return response.data;
}

export async function getCampaign(id) {
  const response = await api.get(`/campaigns/${id}`);
  return response.data;
}

export async function updateCampaign(id, data) {
  const response = await api.put(`/campaigns/${id}`, data);
  return response.data;
}

export async function deleteCampaign(id) {
  const response = await api.delete(`/campaigns/${id}`);
  return response.data;
}

export async function createOrder(data) {
  const response = await api.post('/orders', data);
  return response.data;
}

export async function getOrders(params = {}) {
  const response = await api.get('/orders', { params });
  return response.data;
}

export async function getOrder(id) {
  const response = await api.get(`/orders/${id}`);
  return response.data;
}

export async function updateOrder(id, data) {
  const response = await api.put(`/orders/${id}`, data);
  return response.data;
}

export async function deleteOrder(id) {
  const response = await api.delete(`/orders/${id}`);
  return response.data;
}

export async function aiChat(messages, context) {
  const response = await api.post('/ai/chat', { messages, context });
  return response.data;
}

export async function getAISuggestions(partial, context) {
  const response = await api.post('/ai/suggestions', { partial, context });
  return response.data;
}

export async function getSettings() {
  const response = await api.get('/settings');
  return response.data;
}

export async function updateSettings(data) {
  const response = await api.put('/settings', data);
  return response.data;
}

export async function fetchAdminDashboard() {
  const response = await api.get('/admin/dashboard');
  return response.data;
}

export async function fetchAdminCampaigns(params = {}) {
  const response = await api.get('/admin/campaigns', { params });
  return response.data;
}

export async function fetchAdminCampaign(id) {
  const response = await api.get(`/admin/campaigns/${id}`);
  return response.data;
}

export async function updateCampaignStatus(id, status, remarks = '') {
  const response = await api.put(`/admin/campaigns/${id}/status`, { status, remarks });
  return response.data;
}

export async function uploadCampaignReport(id, file, remarks) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('remarks', remarks);
  const response = await api.post(`/admin/campaigns/${id}/report`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function fetchAdminOrders(params = {}) {
  const response = await api.get('/admin/orders', { params });
  return response.data;
}

export async function fetchAdminOrder(id) {
  const response = await api.get(`/admin/orders/${id}`);
  return response.data;
}

export async function updateOrderStatus(id, status, remarks = '') {
  const response = await api.put(`/admin/orders/${id}/status`, { status, remarks });
  return response.data;
}

export async function uploadOrderReport(id, file, remarks) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('remarks', remarks);
  const response = await api.post(`/admin/orders/${id}/report`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function fetchAdminReports(params = {}) {
  const response = await api.get('/admin/reports', { params });
  return response.data;
}

export async function uploadReport(id, file, remarks) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('remarks', remarks);
  const response = await api.post(`/admin/reports/${id}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function fetchAdminUsers(params = {}) {
  const response = await api.get('/admin/users', { params });
  return response.data;
}

export async function fetchAdminUser(id) {
  const response = await api.get(`/admin/users/${id}`);
  return response.data;
}

export async function updateAdminUser(id, data) {
  const response = await api.put(`/admin/users/${id}`, data);
  return response.data;
}

export async function deactivateUser(id) {
  const response = await api.post(`/admin/users/${id}/deactivate`);
  return response.data;
}

export async function activateUser(id) {
  const response = await api.post(`/admin/users/${id}/activate`);
  return response.data;
}

export async function fetchAdminTickets(params = {}) {
  const response = await api.get('/admin/tickets', { params });
  return response.data;
}

export async function fetchAdminTicket(id) {
  const response = await api.get(`/admin/tickets/${id}`);
  return response.data;
}

export async function addAdminTicketMessage(id, messageBody, isInternal = false, attachments = []) {
  const response = await api.post(`/admin/tickets/${id}/messages`, { messageBody, isInternal, attachments });
  return response.data;
}

export async function updateTicket(id, data) {
  const response = await api.put(`/admin/tickets/${id}`, data);
  return response.data;
}

export async function fetchActivityLogs(params = {}) {
  const response = await api.get('/admin/activity', { params });
  return response.data;
}

export async function fetchTickets(params = {}) {
  const response = await api.get('/tickets', { params });
  return response.data;
}

export async function fetchTicket(id) {
  const response = await api.get(`/tickets/${id}`);
  return response.data;
}

export async function createTicket(data) {
  const response = await api.post('/tickets', data);
  return response.data;
}

export async function addCustomerTicketMessage(id, messageBody, attachments = []) {
  const response = await api.post(`/tickets/${id}/messages`, { messageBody, attachments });
  return response.data;
}

export default api;

export async function login(credentials) {
  const response = await api.post('/auth/login', credentials);
  return response.data;
}

export async function register(userData) {
  const response = await api.post('/auth/register', userData);
  return response.data;
}

export async function verifyEmail(token) {
  const response = await api.post('/auth/verify-email', { token });
  return response.data;
}

export async function resendVerification() {
  const response = await api.post('/auth/resend-verification');
  return response.data;
}

export async function forgotPassword(email) {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
}

export async function resetPassword(token, password) {
  const response = await api.post('/auth/reset-password', { token, password });
  return response.data;
}

export async function getMe() {
  const response = await api.get('/auth/me');
  return response.data;
}

export async function refreshToken(refreshToken) {
  const response = await api.post('/auth/refresh', { refreshToken });
  return response.data;
}

export async function logout(refreshToken) {
  const response = await api.post('/auth/logout', { refreshToken });
  return response.data;
}

export async function impersonate(userId) {
  const response = await api.post('/auth/impersonate', { userId });
  return response.data;
}

export async function stopImpersonation(adminId) {
  const response = await api.post('/auth/stop-impersonation', { adminId });
  return response.data;
}