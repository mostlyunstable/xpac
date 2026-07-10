import axios from 'axios';
import { API_BASE_URL } from '../constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'An unexpected error occurred';
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

export default api;