import { createLazyFileRoute } from '@tanstack/react-router';
import { Repeat, CalendarRange, Clock, ToggleRight, Copy, Bell, Wand2 } from 'lucide-react';
import { PromoHero, PromoSection, FeatureGrid, StepList, CheckList, FinalCTA } from './_components';

export const Route = createLazyFileRoute('/promo/routine')({
  component: PromoRoutinePage,
});

function PromoRoutinePage() {
  return (
    <main>
      <PromoHero
        badge="주간 루틴"
        Icon={Repeat}
        title="한 번 정해두면"
        highlight="매주 자동으로"
        body="월·수·금 영단어, 화·목 수학 — 반복되는 학습을 한 번만 설정하면 매주 그대로 펼쳐집니다."
        primaryHref="/routine"
        primaryLabel="루틴 만들기"
        secondaryHref="/promo"
        secondaryLabel="전체 기능 보기"
      />

      <PromoSection
        title="습관을 자동화하는 도구"
        subtitle="매일 같은 걸 적느라 시간 낭비하지 않습니다."
      >
        <FeatureGrid
          items={[
            {
              icon: CalendarRange,
              title: '요일별 반복',
              body: '월~일 중 원하는 요일만 골라 반복 일정 등록',
            },
            {
              icon: Clock,
              title: '시간대 지정',
              body: '아침·점심·저녁 — 하루 안에서도 블록 단위로',
            },
            {
              icon: ToggleRight,
              title: '활성/비활성 토글',
              body: '시험 기간 등 잠시 멈출 때 한 번에 끄기',
            },
            {
              icon: Copy,
              title: '템플릿 복제',
              body: '주중·주말 등 여러 루틴 세트를 복제해서 빠르게',
            },
            { icon: Bell, title: '시작 알림', body: '루틴 시작 시각에 푸시 알림으로 리마인드' },
            {
              icon: Repeat,
              title: '미션으로 자동 변환',
              body: '오늘 요일에 해당하면 금일 계획에 자동 등록',
            },
          ]}
        />
      </PromoSection>

      <PromoSection title="이렇게 흘러갑니다" tone="muted">
        <div className="mx-auto max-w-3xl">
          <StepList
            steps={[
              { title: '루틴 추가', body: '제목·요일·시간만 적으면 즉시 활성화.' },
              {
                title: '매일 자동 펼침',
                body: '오늘 요일에 해당하는 루틴이 금일 계획에 자동 등록.',
              },
              {
                title: '필요 시 끄기',
                body: '시험 기간·여행 등 잠시 멈추고 싶을 때 한 번에 비활성화.',
              },
            ]}
          />
        </div>
      </PromoSection>

      <PromoSection title="지금 바로 가능한 것">
        <div className="mx-auto max-w-3xl">
          <CheckList
            items={[
              '요일별 반복 일정 등록',
              '시간대·블록 단위 관리',
              '활성/비활성 토글',
              '루틴 템플릿 복제',
              '시작 시각 알림',
              '오늘 미션 자동 등록',
              '주간 캘린더 뷰',
              '루틴 수행률 통계',
            ]}
          />
        </div>
      </PromoSection>

      <FinalCTA
        Icon={Wand2}
        title="첫 루틴은 가장 작은 것부터"
        body="매일 영단어 10개 — 그 정도면 충분합니다."
        primaryHref="/routine"
        primaryLabel="주간 루틴 만들기"
      />
    </main>
  );
}
