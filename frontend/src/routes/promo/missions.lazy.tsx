import { createLazyFileRoute } from '@tanstack/react-router';
import {
  ListChecks,
  CheckSquare,
  Clock,
  Sparkles,
  Plus,
  TrendingUp,
  Bell,
  Wand2,
} from 'lucide-react';
import { PromoHero, PromoSection, FeatureGrid, StepList, CheckList, FinalCTA } from './_components';

export const Route = createLazyFileRoute('/promo/missions')({
  component: PromoMissionsPage,
});

function PromoMissionsPage() {
  return (
    <main>
      <PromoHero
        badge="금일 계획"
        Icon={ListChecks}
        title="오늘 할 일이"
        highlight="3초 안에"
        body="장기 계획·주간 루틴이 매일 아침 자동으로 오늘 미션으로 펼쳐집니다. 빈 노트를 다시 채울 필요가 없어요."
        primaryHref="/missions"
        primaryLabel="오늘 미션 보기"
        secondaryHref="/promo"
        secondaryLabel="전체 기능 보기"
      />

      <PromoSection
        title="오늘 하루를 끝까지 끌고 가는 도구"
        subtitle="아침에 한 번, 저녁에 한 번 — 두 번의 체크인으로 충분합니다."
      >
        <FeatureGrid
          items={[
            { icon: Plus, title: '빠른 미션 추가', body: '한 줄 입력으로 즉시 오늘 목록에 등록' },
            {
              icon: CheckSquare,
              title: '체크박스 한 번',
              body: '완료할 때 학습 시간·진행률이 자동 누적',
            },
            {
              icon: Clock,
              title: '예상 시간 설정',
              body: '미션마다 소요 시간 입력해 하루 총량 자동 계산',
            },
            { icon: TrendingUp, title: '실시간 진행률', body: '상단 바에 오늘 달성률이 즉시 반영' },
            { icon: Bell, title: '미완료 알림', body: '하루 끝나기 전 남은 미션을 알려드립니다' },
            {
              icon: Sparkles,
              title: '루틴 자동 펼침',
              body: '주간 루틴·장기 계획이 매일 자동 생성',
            },
          ]}
        />
      </PromoSection>

      <PromoSection title="이렇게 흘러갑니다" tone="muted">
        <div className="mx-auto max-w-3xl">
          <StepList
            steps={[
              {
                title: '아침에 열기',
                body: '메인 화면에서 오늘의 미션 리스트가 자동으로 펼쳐집니다.',
              },
              {
                title: '실행하며 체크',
                body: '미션 완료할 때마다 체크박스. 학습 시간은 타이머가 자동 기록.',
              },
              {
                title: '저녁에 회고',
                body: '미완료 미션은 내일로 이월하거나 삭제. 오늘의 진행률은 성장 기록에 저장.',
              },
            ]}
          />
        </div>
      </PromoSection>

      <PromoSection title="지금 바로 가능한 것">
        <div className="mx-auto max-w-3xl">
          <CheckList
            items={[
              '빠른 미션 추가·삭제·수정',
              '체크박스 완료·되돌리기',
              '예상 학습 시간 설정',
              '진행률 실시간 표시',
              '주간 루틴 자동 펼침',
              '장기 계획 D-day 표시',
              '미완료 미션 이월',
              '오늘의 학습 시간 합계',
            ]}
          />
        </div>
      </PromoSection>

      <FinalCTA
        Icon={Wand2}
        title="오늘 한 줄 적는 데 30초면 됩니다"
        body="복잡한 계획을 세우기 전에, 오늘 하나만 적어보세요."
        primaryHref="/missions"
        primaryLabel="오늘 미션 열기"
      />
    </main>
  );
}
