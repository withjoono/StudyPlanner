import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export interface TutorBoardEvent {
  id: string;
  type: 'assignment' | 'test';
  title: string;
  date: string; // ISO date string
  className: string;
  lessonTitle: string;
}

interface TutorBoardResponse {
  assignments: TutorBoardEvent[];
  tests: TutorBoardEvent[];
}

export const useGetTutorBoardEvents = () => {
  // TODO: 환경변수로 API URL 관리 (현재는 하드코딩)
  const API_URL = 'http://localhost:4005/integration/calendar-events';

  // 토큰 가져오기 (Hub SSO 쿠키 또는 로컬스토리지 토큰 사용 가정)
  // StudyPlanner가 어떻게 토큰을 저장하는지 확인 필요.
  // 여기서는 axios interceptor가 설정되어 있다고 가정하거나,
  // withCredentials: true로 쿠키를 보낸다고 가정.

  return useQuery({
    queryKey: ['tutorboard-events'],
    queryFn: async () => {
      try {
        // withCredentials: true is crucial if using cookies for auth
        const response = await axios.get<TutorBoardResponse>(API_URL, {
          withCredentials: true,
        });
        return response.data;
      } catch (error) {
        console.warn('Failed to fetch TutorBoard events', error);
        return { assignments: [], tests: [] };
      }
    },
    initialData: { assignments: [], tests: [] },
  });
};
