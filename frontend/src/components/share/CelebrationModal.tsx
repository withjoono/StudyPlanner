/**
 * CelebrationModal — 마일스톤 달성 축하 + 공유 유도 모달
 *
 * 컨페티 애니메이션 + 도토리 보상 표시 + 공유하기 버튼
 */

import { useEffect, useState, useRef } from 'react';
import { X, Share2, Download } from 'lucide-react';
import { StreakShareCard, WeeklyReportShareCard, MilestoneShareCard } from './ShareCard';
import { useShareCard } from '@/hooks/useShareCard';

export type CelebrationMilestone =
  | { type: 'streak'; streak: number; longestStreak: number; userName?: string }
  | {
      type: 'weekly_report';
      achievementRate: number;
      completedMissions: number;
      totalMissions: number;
      studyMinutes: number;
      rank?: number | null;
      totalMembers?: number;
      bestSubject?: string;
      userName?: string;
    }
  | { type: 'milestone'; milestone: string; emoji: string; stat?: string; userName?: string };

interface CelebrationModalProps {
  milestone: CelebrationMilestone | null;
  onClose: () => void;
}

export function CelebrationModal({ milestone, onClose }: CelebrationModalProps) {
  const [confetti, setConfetti] = useState<
    { id: number; x: number; delay: number; color: string }[]
  >([]);
  const cardRef = useRef<HTMLDivElement>(null);
  const { share, isSharing } = useShareCard();

  // 컨페티 생성
  useEffect(() => {
    if (!milestone) return;
    const particles = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.8,
      color: ['#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'][
        Math.floor(Math.random() * 6)
      ],
    }));
    setConfetti(particles);
  }, [milestone]);

  if (!milestone) return null;

  const handleShare = () => {
    const titles: Record<string, string> = {
      streak: '🔥 연속 달성 기록!',
      weekly_report: '📊 이번 주 학습 리포트',
      milestone: '🎉 마일스톤 달성!',
    };

    const texts: Record<string, string> = {
      streak: `나의 연속 달성 기록을 확인해보세요!`,
      weekly_report: '이번 주 학습 성과를 공유합니다!',
      milestone: '새로운 마일스톤을 달성했어요!',
    };

    share({
      title: titles[milestone.type],
      text: texts[milestone.type],
      cardRef: cardRef as React.RefObject<HTMLDivElement>,
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* 컨페티 */}
      {confetti.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'fixed',
            left: `${p.x}%`,
            top: -20,
            width: 8,
            height: 8,
            borderRadius: 2,
            backgroundColor: p.color,
            animation: `confetti-fall 2.5s ${p.delay}s ease-in forwards`,
            zIndex: 10000,
          }}
        />
      ))}

      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes celebration-enter {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* 모달 */}
      <div
        style={{
          position: 'relative',
          maxWidth: 440,
          width: '90%',
          animation: 'celebration-enter 0.5s ease-out',
        }}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: -16,
            right: -16,
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: 'white',
            border: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <X style={{ width: 18, height: 18, color: '#6b7280' }} />
        </button>

        {/* 공유 카드 (캡처 대상) */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {milestone.type === 'streak' && (
            <StreakShareCard
              ref={cardRef}
              streak={milestone.streak}
              longestStreak={milestone.longestStreak}
              userName={milestone.userName}
            />
          )}
          {milestone.type === 'weekly_report' && (
            <WeeklyReportShareCard
              ref={cardRef}
              achievementRate={milestone.achievementRate}
              completedMissions={milestone.completedMissions}
              totalMissions={milestone.totalMissions}
              studyMinutes={milestone.studyMinutes}
              rank={milestone.rank}
              totalMembers={milestone.totalMembers}
              bestSubject={milestone.bestSubject}
              userName={milestone.userName}
            />
          )}
          {milestone.type === 'milestone' && (
            <MilestoneShareCard
              ref={cardRef}
              milestone={milestone.milestone}
              emoji={milestone.emoji}
              stat={milestone.stat}
              userName={milestone.userName}
            />
          )}
        </div>

        {/* 공유 버튼 */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 16,
            justifyContent: 'center',
          }}
        >
          <button
            onClick={handleShare}
            disabled={isSharing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 28px',
              borderRadius: 16,
              border: 'none',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              color: 'white',
              fontSize: 15,
              fontWeight: 700,
              cursor: isSharing ? 'wait' : 'pointer',
              opacity: isSharing ? 0.7 : 1,
              boxShadow: '0 4px 12px rgba(79,70,229,0.4)',
              transition: 'transform 0.1s',
            }}
          >
            <Share2 style={{ width: 18, height: 18 }} />
            {isSharing ? '공유 중...' : '친구에게 자랑하기 🌰+10'}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '12px 20px',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              backdropFilter: 'blur(4px)',
            }}
          >
            나중에
          </button>
        </div>
      </div>
    </div>
  );
}
