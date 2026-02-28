import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// API Client (Assuming a global instance or using axios directly)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

// Interceptor to add token (Simplified, ideally reuse existing client)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ConnectionPermissions {
  kyokwa: string;
  subjectName: string;
  allSubjects: boolean;
  isActive: boolean;
}

export interface ConnectedTeacher {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  connectionId: string;
  permissions: ConnectionPermissions[];
}

export interface ConnectedParent {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  connectionId: string;
  relation: string;
}

export interface ConnectionResponse {
  teachers: ConnectedTeacher[];
  parents: ConnectedParent[];
  students: any[];
}

export const useStudentConnections = () => {
  return useQuery({
    queryKey: ['student', 'connections'],
    queryFn: async () => {
      const { data } = await api.get<ConnectionResponse>('/student/connections');
      return data;
    },
  });
};

export const useUpdateTeacherPermissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      teacherId,
      permissions,
    }: {
      teacherId: string;
      permissions: { kyokwa: string; allowed: boolean }[];
    }) => {
      const { data } = await api.patch(`/student/connections/teacher/${teacherId}/permissions`, {
        permissions,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'connections'] });
    },
  });
};
