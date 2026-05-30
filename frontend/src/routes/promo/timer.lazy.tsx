import { createLazyFileRoute } from '@tanstack/react-router';
import { Timer, Play, Coffee, BookOpen, Bell, TrendingUp, Wand2 } from 'lucide-react';
import { PromoHero, PromoSection, FeatureGrid, StepList, CheckList, FinalCTA } from './_components';

export const Route = createLazyFileRoute('/promo/timer')({
  component: PromoTimerPage,
});

function PromoTimerPage() {
  return (
    <main>
      <PromoHero
        badge="집중 타이머"
        Icon={Timer}
        title="25분 집중,"
        highlight="5분 휴식"
        body="포모도로 25/50/90분 — 집중 시간이 끝나면 자동으로 학습 시간에 적립됩니다. 미션·과목과 자동 연결돼요."
        primaryHref="/timer"
        primaryLabel="타이머 시작"
        secondaryHref="/promo"
        secondaryLabel="전체 기능 보기"
      />

      <PromoSection
        title="집중이 기록으로 남는 도구"
        subtitle="공부한 시간이 곧 미래의 분석 데이터."
      >
        <FeatureGrid
          items={[
            {
              icon: Play,
              title: '25/50/90분 프리셋',
              body: '한 번 클릭으로 가장 흔한 집중 길이 선택',
            },
            {
              icon: Coffee,
              title: '자동 휴식',
              body: '집중 종료 후 5분 휴식이 자동으로 이어집니다',
            },
            {
              icon: BookOpen,
              title: '미션 연동',
              body: '시작 전 미션을 선택하면 시간이 그 미션에 적립',
            },
            { icon: Bell, title: '종료 알림', body: '시작·종료마다 부드러운 알림음과 진동' },
            {
              icon: TrendingUp,
              title: '자동 누적',
              body: '학습 시간이 성장 기록·학습 분석에 즉시 반영',
            },
            { icon: Timer, title: '집중 스트릭', body: '연속 집중 세션 수를 카운트해 동기 부여' },
          ]}
        />
      </PromoSection>

      <PromoSection title="이렇게 흘러갑니다" tone="muted">
        <div className="mx-auto max-w-3xl">
          <StepList
            steps={[
              { title: '미션 선택 후 시작', body: '오늘 미션 중 하나를 골라 25분 버튼 클릭.' },
              { title: '집중 + 자동 휴식', body: '25분 끝나면 5분 휴식 — 강제로라도 쉬도록 설계.' },
              { title: '자동 적립', body: '집중 시간이 학습 분석·성장 기록에 자동 누적.' },
            ]}
          />
        </div>
      </PromoSection>

      <PromoSection title="지금 바로 가능한 것">
        <div className="mx-auto max-w-3xl">
          <CheckList
            items={[
              '25·50·90분 프리셋',
              '자동 휴식 5분',
              '시작 전 미션·과목 선택',
              '시작·종료 알림',
              '학습 시간 자동 적립',
              '집중 세션 스트릭',
              '백그라운드 진행',
              '오늘 집중 합계 표시',
            ]}
          />
        </div>
      </PromoSection>

      <FinalCTA
        Icon={Wand2}
        title="첫 25분만 시작해보세요"
        body="자리에 앉기까지가 가장 어렵습니다. 클릭 한 번 — 다음은 타이머가 끌고 갑니다."
        primaryHref="/timer"
        primaryLabel="집중 타이머 시작"
      />
    </main>
  );
}
