import { createLazyFileRoute } from '@tanstack/react-router';
import { Target, Calendar, Flag, BookOpen, Layers, TrendingUp, Wand2 } from 'lucide-react';
import { PromoHero, PromoSection, FeatureGrid, StepList, CheckList, FinalCTA } from './_components';

export const Route = createLazyFileRoute('/promo/plans')({
  component: PromoPlansPage,
});

function PromoPlansPage() {
  return (
    <main>
      <PromoHero
        badge="장기 계획"
        Icon={Target}
        title="6개월 뒤의 나를"
        highlight="오늘로 끌어옵니다"
        body="목표·과목·D-day 단위로 장기 계획을 세우면, 매일 아침 그 조각이 오늘 미션으로 자동 펼쳐집니다."
        primaryHref="/plans"
        primaryLabel="장기 계획 만들기"
        secondaryHref="/promo"
        secondaryLabel="전체 기능 보기"
      />

      <PromoSection
        title="목표가 흐지부지되지 않는 이유"
        subtitle="장기 계획이 매일의 미션으로 자동 분해되기 때문입니다."
      >
        <FeatureGrid
          items={[
            { icon: Flag, title: '목표 설정', body: '시험·등급·점수 등 정량 목표를 자유롭게 등록' },
            {
              icon: Calendar,
              title: 'D-day 추적',
              body: '목표일까지 남은 일수를 상단 카드로 항상 표시',
            },
            {
              icon: BookOpen,
              title: '과목별 계획',
              body: '국·영·수·탐구 — 과목별로 진도와 분량 관리',
            },
            {
              icon: Layers,
              title: '단계 분해',
              body: '큰 목표를 주차·월 단위 마일스톤으로 자동 분해',
            },
            {
              icon: TrendingUp,
              title: '진척률 그래프',
              body: '계획 대비 실제 진도가 실시간 그래프로',
            },
            {
              icon: Target,
              title: '여러 목표 동시 관리',
              body: '학기·시험·자격증 — 여러 목표를 한 화면에',
            },
          ]}
        />
      </PromoSection>

      <PromoSection title="3단계로 장기 계획 시작" tone="muted">
        <div className="mx-auto max-w-3xl">
          <StepList
            steps={[
              { title: '목표 입력', body: '과목·달성 수치·목표일만 적으면 계획이 만들어집니다.' },
              { title: '단계 분해', body: '주차별·월별 마일스톤이 자동 생성. 직접 수정도 가능.' },
              {
                title: '매일 자동 펼침',
                body: '오늘 해야 할 분량이 금일 계획에 자동으로 올라옵니다.',
              },
            ]}
          />
        </div>
      </PromoSection>

      <PromoSection title="지금 바로 가능한 것">
        <div className="mx-auto max-w-3xl">
          <CheckList
            items={[
              '목표 생성·수정·완료 처리',
              'D-day 카운트다운',
              '과목별·시험별 계획 분리',
              '월·주 단위 마일스톤',
              '계획 대비 진척률 그래프',
              '미션으로 자동 펼침',
              '여러 목표 동시 관리',
              '목표 달성 시 자동 회고 카드',
            ]}
          />
        </div>
      </PromoSection>

      <FinalCTA
        Icon={Wand2}
        title="첫 목표 하나만 적어보세요"
        body="계획은 매일 다듬으면 됩니다. 시작이 절반이에요."
        primaryHref="/plans"
        primaryLabel="장기 계획 시작"
      />
    </main>
  );
}
