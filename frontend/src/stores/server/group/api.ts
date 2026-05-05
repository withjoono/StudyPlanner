import { authClient } from '@/lib/api/instances';

export interface JoinStudyGroupDto {
  sourceApp: 'jungsi' | 'susi';
  grade: string;
  reason: string;
}

/**
 * 목표 대학 설정 완료 시 호출하는 함수
 * @param appType 'jungsi' 또는 'susi'
 * @param studentGrade 학생 학년 (예: 'H3')
 * @param targetUniv 목표 대학명 (예: '연세대학교 의예과')
 */
export async function joinStudyGroupAutomatically(
  appType: 'jungsi' | 'susi',
  studentGrade: string,
  targetUniv: string,
) {
  try {
    await authClient.post('/api/groups/auto-join', {
      sourceApp: appType,
      grade: studentGrade,
      reason: `목표대학: ${targetUniv}`,
    } as JoinStudyGroupDto);
    console.log(`[Hub] ${appType} 파이터반 자동 가입 성공`);
  } catch (error) {
    console.error(`[Hub] 반 자동 가입 실패:`, error);
    // 중요: 랭킹 가입 실패가 메인 비즈니스 로직(목표 설정)을 막으면 안 되므로 조용히 처리합니다.
  }
}
