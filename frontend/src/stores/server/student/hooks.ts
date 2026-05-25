import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plannerClient } from '@/lib/api/instances';

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
      const { data } = await plannerClient.get<ConnectionResponse>('/student/connections');
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
      const { data } = await plannerClient.patch(
        `/student/connections/teacher/${teacherId}/permissions`,
        {
          permissions,
        },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'connections'] });
    },
  });
};
