/**
 * ShareCard — SNS 공유용 카드 이미지 레이아웃
 *
 * html2canvas로 캡처되는 DOM 요소.
 * 숨겨진 영역에 렌더링 → 캡처 → 이미지 생성
 */

import { forwardRef } from 'react';

// ============================================
// 공통 카드 레이아웃
// ============================================

interface ShareCardBaseProps {
  children: React.ReactNode;
  /** 배경 그라디언트 */
  gradient?: string;
}

const ShareCardBase = forwardRef<HTMLDivElement, ShareCardBaseProps>(
  ({ children, gradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          width: 400,
          padding: 32,
          borderRadius: 24,
          background: gradient,
          fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif",
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 배경 장식 원 */}
        <div
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }}
        />

        {/* 콘텐츠 */}
        <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>

        {/* 하단 워터마크 */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            marginTop: 24,
            paddingTop: 16,
            borderTop: '1px solid rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.7 }}>🌱 StudyPlanner by 거북스쿨</div>
          <div style={{ fontSize: 11, opacity: 0.5 }}>geobukschool.kr</div>
        </div>
      </div>
    );
  },
);

ShareCardBase.displayName = 'ShareCardBase';

// ============================================
// Streak 카드
// ============================================

interface StreakCardProps {
  streak: number;
  longestStreak: number;
  userName?: string;
}

export const StreakShareCard = forwardRef<HTMLDivElement, StreakCardProps>(
  ({ streak, longestStreak, userName }, ref) => {
    return (
      <ShareCardBase
        ref={ref}
        gradient="linear-gradient(135deg, #f97316 0%, #ef4444 50%, #ec4899 100%)"
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🔥</div>
          <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 4 }}>
            {userName ? `${userName}님의` : '나의'} 연속 달성
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              lineHeight: 1,
              textShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
          >
            {streak}
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>일 연속!</div>

          <div
            style={{
              marginTop: 20,
              display: 'flex',
              justifyContent: 'center',
              gap: 24,
            }}
          >
            <div
              style={{
                background: 'rgba(255,255,255,0.15)',
                borderRadius: 12,
                padding: '8px 16px',
              }}
            >
              <div style={{ fontSize: 11, opacity: 0.7 }}>🏆 최장 기록</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{longestStreak}일</div>
            </div>
          </div>
        </div>
      </ShareCardBase>
    );
  },
);

StreakShareCard.displayName = 'StreakShareCard';

// ============================================
// 주간 리포트 카드
// ============================================

interface WeeklyReportCardProps {
  achievementRate: number;
  completedMissions: number;
  totalMissions: number;
  studyMinutes: number;
  rank?: number | null;
  totalMembers?: number;
  bestSubject?: string;
  userName?: string;
}

export const WeeklyReportShareCard = forwardRef<HTMLDivElement, WeeklyReportCardProps>(
  (
    {
      achievementRate,
      completedMissions,
      totalMissions,
      studyMinutes,
      rank,
      totalMembers,
      bestSubject,
      userName,
    },
    ref,
  ) => {
    const hours = Math.floor(studyMinutes / 60);
    const mins = studyMinutes % 60;

    return (
      <ShareCardBase
        ref={ref}
        gradient="linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)"
      >
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 14, opacity: 0.8 }}>
            {userName ? `${userName}님의` : '나의'} 이번 주
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>📊 학습 리포트</div>
        </div>

        {/* 달성률 메인 */}
        <div
          style={{
            textAlign: 'center',
            background: 'rgba(255,255,255,0.12)',
            borderRadius: 16,
            padding: '16px 0',
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 48, fontWeight: 900, lineHeight: 1 }}>{achievementRate}%</div>
          <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>달성률</div>
        </div>

        {/* 상세 지표 */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 12,
              padding: 12,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 11, opacity: 0.7 }}>완료 미션</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {completedMissions}/{totalMissions}
            </div>
          </div>
          <div
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 12,
              padding: 12,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 11, opacity: 0.7 }}>학습 시간</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {hours}h {mins}m
            </div>
          </div>
          {rank && (
            <div
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 12,
                padding: 12,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 11, opacity: 0.7 }}>🏅 순위</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                {rank}위{totalMembers ? `/${totalMembers}` : ''}
              </div>
            </div>
          )}
        </div>

        {bestSubject && (
          <div
            style={{
              marginTop: 12,
              textAlign: 'center',
              fontSize: 13,
              opacity: 0.8,
            }}
          >
            ⭐ 가장 잘한 과목: <strong>{bestSubject}</strong>
          </div>
        )}
      </ShareCardBase>
    );
  },
);

WeeklyReportShareCard.displayName = 'WeeklyReportShareCard';

// ============================================
// 마일스톤 카드
// ============================================

interface MilestoneCardProps {
  milestone: string; // "100개 미션 완료!" 등
  emoji: string;
  stat?: string;
  userName?: string;
}

export const MilestoneShareCard = forwardRef<HTMLDivElement, MilestoneCardProps>(
  ({ milestone, emoji, stat, userName }, ref) => {
    return (
      <ShareCardBase
        ref={ref}
        gradient="linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)"
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>{emoji}</div>
          <div style={{ fontSize: 14, opacity: 0.8 }}>
            {userName ? `${userName}님` : '축하합니다!'}
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              marginTop: 8,
              textShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            {milestone}
          </div>
          {stat && (
            <div
              style={{
                marginTop: 16,
                background: 'rgba(255,255,255,0.15)',
                borderRadius: 12,
                padding: '8px 20px',
                display: 'inline-block',
                fontSize: 14,
              }}
            >
              {stat}
            </div>
          )}
        </div>
      </ShareCardBase>
    );
  },
);

MilestoneShareCard.displayName = 'MilestoneShareCard';
