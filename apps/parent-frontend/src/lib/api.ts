import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const parentApi = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Auth token interceptor
parentApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('parent_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
