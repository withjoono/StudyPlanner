import { createLazyFileRoute } from '@tanstack/react-router';
import { Users, Hash, Star, MessageSquare, Trophy, Network, Wand2 } from 'lucide-react';
import { PromoHero, PromoSection, FeatureGrid, StepList, CheckList, FinalCTA } from './_components';

export const Route = createLazyFileRoute('/promo/groups')({
  component: PromoGroupsPage,
});

function PromoGroupsPage() {
  return (
    <main>
      <PromoHero
        badge="마이그룹 · 생태계 연동"
        Icon={Users}
        title="혼자 공부하지"
        highlight="않습니다"
        body="선생님 채점·반 친구 순위·StudyArena 그룹 경쟁. 한 학생 계정이 거북스쿨 5개 앱과 자동으로 이어집니다."
        primaryHref="/myclass"
        primaryLabel="마이그룹 열기"
        secondaryHref="https://www.tskool.kr"
        secondaryLabel="Hub에서 가입"
      />

      <PromoSection
        title="내 학습을 함께 보는 사람들"
        subtitle="선생님·반 친구·학부모가 한 데이터를 자기 화면에서 봅니다."
      >
        <FeatureGrid
          items={[
            {
              icon: Hash,
              title: '초대 코드 가입',
              body: '선생님이 발급한 6자리 코드로 반에 즉시 합류',
            },
            { icon: Star, title: '선생님 채점', body: '담당 선생님이 1~10점으로 매일 학습량 채점' },
            {
              icon: MessageSquare,
              title: '비공개 코멘트',
              body: '선생님이 학생에게 비공개로 피드백 전달',
            },
            { icon: Trophy, title: '반 학습 순위', body: '같은 반 친구들과 주간 학습 시간 랭킹' },
            { icon: Users, title: '학생 스터디 그룹', body: '친구끼리 자체 스터디 그룹 생성·운영' },
            {
              icon: Network,
              title: 'StudyArena 연동',
              body: '학습 시간이 자동으로 그룹 경쟁 점수에 반영',
            },
          ]}
        />
      </PromoSection>

      <PromoSection title="한 계정이 5개 앱과 연결" tone="muted">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="bg-primary text-primary-foreground rounded-2xl p-5 sm:col-span-2 lg:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-80">중심</p>
              <p className="mt-2 text-lg font-bold">학습 플래너</p>
              <p className="mt-1 text-xs opacity-80">내 학습의 본진</p>
            </div>
            {[
              { name: 'Hub', desc: '계정연동·SSO·일정 공유' },
              { name: 'TeacherAdmin', desc: '담당 선생님 채점·코멘트' },
              { name: 'StudyArena', desc: '그룹 학습 경쟁·랭킹' },
              { name: 'ExamHub', desc: '시험 결과·오답·약점' },
              { name: 'ParentAdmin', desc: '학부모용 자녀 학습 화면' },
            ].map((e) => (
              <div key={e.name} className="bg-card rounded-2xl border p-5">
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                  앱
                </p>
                <p className="text-foreground mt-2 text-lg font-bold">{e.name}</p>
                <p className="text-muted-foreground mt-1 text-xs">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </PromoSection>

      <PromoSection title="가입부터 그룹 합류까지">
        <div className="mx-auto max-w-3xl">
          <StepList
            steps={[
              {
                title: 'Hub에서 한 번 가입',
                body: 'tskool.kr에서 학생 계정 생성. 5개 앱 모두 같은 계정으로 사용.',
              },
              {
                title: '선생님 초대 코드 입력',
                body: '담당 선생님이 발급한 6자리 코드로 반에 합류.',
              },
              {
                title: '자동 연동 시작',
                body: '학습 기록이 선생님·학부모·StudyArena에 자동 흐릅니다.',
              },
            ]}
          />
        </div>
      </PromoSection>

      <PromoSection title="지금 바로 가능한 것" tone="muted">
        <div className="mx-auto max-w-3xl">
          <CheckList
            items={[
              '초대 코드로 반 합류',
              '선생님 1~10점 채점 확인',
              '선생님 비공개 코멘트 확인',
              '반 학습 시간 순위',
              '학생끼리 스터디 그룹',
              'StudyArena 그룹 경쟁',
              'Hub SSO 자동 로그인',
              '학부모 ParentAdmin 연동',
            ]}
          />
        </div>
      </PromoSection>

      <FinalCTA
        Icon={Wand2}
        title="혼자 시작하고 함께 성장"
        body="먼저 Hub에서 계정 만들고, 담당 선생님 코드를 받으면 됩니다."
        primaryHref="/myclass"
        primaryLabel="마이그룹 시작"
      />
    </main>
  );
}
