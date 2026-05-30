import { createLazyFileRoute } from '@tanstack/react-router';
import { TrendingUp, Flame, Trophy, Calendar, Users, BarChart3, Wand2 } from 'lucide-react';
import { PromoHero, PromoSection, FeatureGrid, StepList, CheckList, FinalCTA } from './_components';

export const Route = createLazyFileRoute('/promo/growth')({
  component: PromoGrowthPage,
});

function PromoGrowthPage() {
  return (
    <main>
      <PromoHero
        badge="성장 기록"
        Icon={TrendingUp}
        title="꾸준함을"
        highlight="눈에 보이게"
        body="주간 학습 시간·스트릭·달성률이 매일 누적되고, 친구·반과 비교한 순위로 동기가 끊기지 않습니다."
        primaryHref="/growth"
        primaryLabel="성장 기록 보기"
        secondaryHref="/promo"
        secondaryLabel="전체 기능 보기"
      />

      <PromoSection
        title="동기가 끊기지 않는 이유"
        subtitle="단순한 통계가 아니라, 비교할 대상과 회고할 기록이 함께 있기 때문."
      >
        <FeatureGrid
          items={[
            {
              icon: Flame,
              title: '학습 스트릭',
              body: '매일 미션을 한 개라도 하면 연속 학습일이 누적',
            },
            {
              icon: BarChart3,
              title: '주간 학습 시간',
              body: '이번 주 vs 지난 주, 막대 그래프로 한눈에 비교',
            },
            {
              icon: Calendar,
              title: '달성률 트렌드',
              body: '주차별·월별 계획 대비 실제 달성률 추이',
            },
            { icon: Trophy, title: '주간 회고 카드', body: '한 주가 끝나면 자동 요약 카드로 정리' },
            {
              icon: Users,
              title: '반·그룹 순위',
              body: '같은 반·그룹 친구들과 학습 시간 랭킹 비교',
            },
            {
              icon: TrendingUp,
              title: '강점·약점 맵',
              body: '과목별 학습 시간 비중으로 편중·약점 진단',
            },
          ]}
        />
      </PromoSection>

      <PromoSection title="회고가 자연스러워지는 흐름" tone="muted">
        <div className="mx-auto max-w-3xl">
          <StepList
            steps={[
              {
                title: '매일 자동 누적',
                body: '미션 완료·타이머 종료마다 학습 시간과 달성률이 자동 기록.',
              },
              {
                title: '주말에 요약 카드',
                body: '일요일에 한 주를 정리하는 회고 카드가 자동 생성.',
              },
              {
                title: '다음 주 계획에 반영',
                body: '약점 과목·미달성 목표가 다음 주 계획에 자동 추천.',
              },
            ]}
          />
        </div>
      </PromoSection>

      <PromoSection title="지금 바로 가능한 것">
        <div className="mx-auto max-w-3xl">
          <CheckList
            items={[
              '학습 스트릭 카운트',
              '주간·월간 학습 시간 그래프',
              '계획 대비 달성률 트렌드',
              '주간 자동 회고 카드',
              '반·그룹 순위 랭킹',
              '과목별 강점·약점 맵',
              '기분·메모 회고',
              '월간 캘린더 히트맵',
            ]}
          />
        </div>
      </PromoSection>

      <FinalCTA
        Icon={Wand2}
        title="오늘부터 스트릭 1일째"
        body="미션 하나만 완료하면 오늘의 기록이 시작됩니다."
        primaryHref="/growth"
        primaryLabel="성장 기록 열기"
      />
    </main>
  );
}
