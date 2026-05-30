import { createLazyFileRoute } from '@tanstack/react-router';
import { BarChart3, PieChart, BookOpen, Clock, Lightbulb, Activity, Wand2 } from 'lucide-react';
import { PromoHero, PromoSection, FeatureGrid, StepList, CheckList, FinalCTA } from './_components';

export const Route = createLazyFileRoute('/promo/learning')({
  component: PromoLearningPage,
});

function PromoLearningPage() {
  return (
    <main>
      <PromoHero
        badge="학습 분석"
        Icon={BarChart3}
        title="시간을 어디에"
        highlight="썼는지 보입니다"
        body="교과별·주차별 학습 시간을 시각화해 편중·공백·약점을 즉시 진단합니다. 다음 주 계획에 그대로 반영됩니다."
        primaryHref="/learning"
        primaryLabel="학습 분석 보기"
        secondaryHref="/promo"
        secondaryLabel="전체 기능 보기"
      />

      <PromoSection
        title="감으로 공부하지 않게 해주는 도구"
        subtitle="기록된 시간이 곧 데이터입니다."
      >
        <FeatureGrid
          items={[
            {
              icon: PieChart,
              title: '과목별 비중',
              body: '국·영·수·탐구 — 주간 학습 시간 도넛 차트',
            },
            { icon: BarChart3, title: '주차별 추이', body: '최근 4·8·12주 학습 시간 막대 그래프' },
            {
              icon: BookOpen,
              title: '단원별 누적',
              body: '과목 안에서 어느 단원에 시간을 썼는지 분해',
            },
            {
              icon: Clock,
              title: '시간대별 집중도',
              body: '아침·낮·저녁 중 가장 집중이 잘 되는 시간 진단',
            },
            {
              icon: Lightbulb,
              title: '편중·공백 진단',
              body: '특정 과목 편중·일주일 이상 공백을 자동 경고',
            },
            {
              icon: Activity,
              title: '시험 결과 연동',
              body: 'ExamHub 시험 점수와 학습 시간을 함께 비교',
            },
          ]}
        />
      </PromoSection>

      <PromoSection title="이렇게 활용하세요" tone="muted">
        <div className="mx-auto max-w-3xl">
          <StepList
            steps={[
              {
                title: '타이머·미션으로 시간 적립',
                body: '집중 타이머를 돌리면 과목·단원 단위로 자동 누적.',
              },
              {
                title: '주말에 그래프 확인',
                body: '주말에 한 번 — 어디에 시간이 몰렸고 어디가 비었는지 확인.',
              },
              {
                title: '약한 과목 다음 주 보강',
                body: '편중·공백 경고를 다음 주 장기 계획·루틴에 반영.',
              },
            ]}
          />
        </div>
      </PromoSection>

      <PromoSection title="지금 바로 가능한 것">
        <div className="mx-auto max-w-3xl">
          <CheckList
            items={[
              '과목별 학습 시간 도넛',
              '주차별·월별 추이 그래프',
              '단원·태그별 시간 분해',
              '시간대별 집중도 분석',
              '편중·공백 자동 경고',
              '시험 점수 vs 학습 시간',
              '주차 비교(이번주 vs 지난주)',
              '엑셀 내보내기',
            ]}
          />
        </div>
      </PromoSection>

      <FinalCTA
        Icon={Wand2}
        title="공부 시간이 곧 데이터입니다"
        body="기록 한 주만 쌓이면 첫 분석 리포트가 자동으로 만들어집니다."
        primaryHref="/learning"
        primaryLabel="학습 분석 열기"
      />
    </main>
  );
}
