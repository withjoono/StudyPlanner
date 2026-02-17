import { useQuery } from '@tanstack/react-query';
import { teacherApi } from '../lib/api';

export interface Student {
  id: number;
  name: string;
  studentCode: string;
  schoolName?: string;
  grade?: string;
  schoolLevel?: string;
  phone?: string;
  parentPhone?: string;
  teacherStudentId: number;
  managedSubjects: {
    id: number;
    kyokwa: string;
    subjectName?: string;
    allSubjects: boolean;
    isActive: boolean;
  }[];
}

export function useStudents() {
  return useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data } = await teacherApi.get<Student[]>('/teacher/students');
      return data;
    },
  });
}
