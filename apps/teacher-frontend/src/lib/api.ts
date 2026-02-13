import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const teacherApi = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

teacherApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('teacher_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
