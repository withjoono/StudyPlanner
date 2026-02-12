/**
 * 장기 계획 관리 페이지
 * - 교재 DB에서 교재 선택
 * - 목차 범위 선택
 * - 자동 분배 기능
 */

import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  ArrowLeft,
  Loader2,
  BookOpen,
  Video,
  Target,
  TrendingUp,
  Search,
  Calendar,
  Sparkles,
  Check,
} from 'lucide-react';
import {
  useGetPlans,
  useGetMaterials,
  useCreatePlanWithMaterial,
  useDistributePlan,
  useGetRoutines,
  useDeletePlan,
} from '@/stores/server/planner';
import type { Material, ExtendedLongTermPlan } from '@/stores/server/planner/mock-data';
import type { LongTermPlan } from '@/types/planner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export const Route = createLazyFileRoute('/plans')({
  component: PlannerPlansPage,
});

// ============================================
// 상수
// ============================================

const SUBJECT_COLORS: Record<string, { bg: string; text: string }> = {
  국어: { bg: 'bg-red-500', text: 'text-red-600' },
  수학: { bg: 'bg-yellow-500', text: 'text-yellow-600' },
  영어: { bg: 'bg-orange-500', text: 'text-orange-600' },
  사회: { bg: 'bg-blue-500', text: 'text-blue-600' },
  과학: { bg: 'bg-teal-500', text: 'text-teal-600' },
  한국사: { bg: 'bg-purple-500', text: 'text-purple-600' },
};

const SUBJECT_CODE_MAP: Record<string, string> = {
  korean: '국어',
  math: '수학',
  english: '영어',
  science: '과학',
  social: '사회',
  history: '한국사',
  foreign: '제2외국어',
  other: '기타',
};

// ============================================
// 교재 선택 다이얼로그
// ============================================

interface MaterialSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (material: Material, startChapter: number, endChapter: number) => void;
}

function MaterialSelectDialog({ open, onOpenChange, onSelect }: MaterialSelectDialogProps) {
  const { data: materials } = useGetMaterials();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [startChapter, setStartChapter] = useState(1);
  const [endChapter, setEndChapter] = useState(1);
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());

  const filteredMaterials = useMemo(() => {
    if (!materials) return [];
    if (!searchKeyword) return materials;
    const lower = searchKeyword.toLowerCase();
    return materials.filter(
      (m) =>
        m.name.toLowerCase().includes(lower) ||
        m.publisher?.toLowerCase().includes(lower) ||
        m.author?.toLowerCase().includes(lower),
    );
  }, [materials, searchKeyword]);

  const toggleChapter = (chapterId: number) => {
    const newSet = new Set(expandedChapters);
    if (newSet.has(chapterId)) {
      newSet.delete(chapterId);
    } else {
      newSet.add(chapterId);
    }
    setExpandedChapters(newSet);
  };

  const handleSelectMaterial = (material: Material) => {
    setSelectedMaterial(material);
    setStartChapter(1);
    setEndChapter(material.chapters.length);
  };

  const handleConfirm = () => {
    if (selectedMaterial) {
      onSelect(selectedMaterial, startChapter, endChapter);
      onOpenChange(false);
      setSelectedMaterial(null);
      setSearchKeyword('');
    }
  };

  // 선택된 범위의 페이지/강의 수 계산
  const selectedRange = useMemo(() => {
    if (!selectedMaterial) return { pages: 0, lectures: 0, estimatedHours: 0 };

    const chapters = selectedMaterial.chapters.filter(
      (c) => c.chapterNumber >= startChapter && c.chapterNumber <= endChapter,
    );

    const pages = chapters.reduce((sum, c) => sum + (c.pageCount || 0), 0);
    const lectures = chapters.reduce((sum, c) => sum + (c.lectureCount || 0), 0);
    const estimatedMinutes = chapters.reduce((sum, c) => sum + (c.estimatedTime || 0), 0);

    return {
      pages,
      lectures,
      estimatedHours: Math.round(estimatedMinutes / 60),
    };
  }, [selectedMaterial, startChapter, endChapter]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>교재 선택</DialogTitle>
        </DialogHeader>

        <div className="flex h-[600px] gap-4">
          {/* 왼쪽: 교재 목록 */}
          <div className="flex w-1/2 flex-col border-r pr-4">
            {/* 검색 */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="교재명, 출판사, 저자 검색..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* 교재 목록 */}
            <div className="flex-1 space-y-2 overflow-y-auto">
              {filteredMaterials.map((material) => (
                <div
                  key={material.id}
                  onClick={() => handleSelectMaterial(material)}
                  className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                    selectedMaterial?.id === material.id
                      ? 'border-ultrasonic-500 bg-ultrasonic-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                        material.category === 'lecture' ? 'bg-purple-100' : 'bg-blue-100'
                      }`}
                    >
                      {material.category === 'lecture' ? (
                        <Video className="h-5 w-5 text-purple-600" />
                      ) : (
                        <BookOpen className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-medium text-white ${
                            SUBJECT_COLORS[SUBJECT_CODE_MAP[material.subjectCode] || '기타']?.bg ||
                            'bg-gray-500'
                          }`}
                        >
                          {SUBJECT_CODE_MAP[material.subjectCode] || '기타'}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {material.category === 'lecture'
                            ? '인강'
                            : material.category === 'textbook'
                              ? '교과서'
                              : '참고서'}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm font-medium">{material.name}</p>
                      <p className="text-xs text-gray-500">
                        {material.publisher}
                        {material.author && ` · ${material.author}`}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {material.totalPages
                          ? `${material.totalPages}p`
                          : `${material.totalLectures}강`}{' '}
                        · 예상 {material.estimatedHours}시간
                      </p>
                    </div>
                    {selectedMaterial?.id === material.id && (
                      <Check className="text-ultrasonic-500 h-5 w-5" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 오른쪽: 목차 선택 */}
          <div className="flex w-1/2 flex-col pl-2">
            {selectedMaterial ? (
              <>
                <h4 className="mb-3 font-semibold">{selectedMaterial.name} - 목차</h4>

                {/* 범위 선택 */}
                <div className="mb-4 rounded-lg bg-gray-50 p-3">
                  <p className="mb-2 text-sm font-medium text-gray-700">학습 범위 선택</p>
                  <div className="flex items-center gap-2">
                    <select
                      value={startChapter}
                      onChange={(e) => setStartChapter(Number(e.target.value))}
                      className="rounded border px-2 py-1 text-sm"
                    >
                      {selectedMaterial.chapters.map((c) => (
                        <option key={c.id} value={c.chapterNumber}>
                          {c.chapterNumber}장
                        </option>
                      ))}
                    </select>
                    <span className="text-gray-500">~</span>
                    <select
                      value={endChapter}
                      onChange={(e) => setEndChapter(Number(e.target.value))}
                      className="rounded border px-2 py-1 text-sm"
                    >
                      {selectedMaterial.chapters
                        .filter((c) => c.chapterNumber >= startChapter)
                        .map((c) => (
                          <option key={c.id} value={c.chapterNumber}>
                            {c.chapterNumber}장
                          </option>
                        ))}
                    </select>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    선택된 범위:{' '}
                    {selectedMaterial.category === 'lecture'
                      ? `${selectedRange.lectures}강`
                      : `${selectedRange.pages}페이지`}{' '}
                    · 예상 {selectedRange.estimatedHours}시간
                  </p>
                </div>

                {/* 목차 트리 */}
                <div className="flex-1 space-y-1 overflow-y-auto">
                  {selectedMaterial.chapters.map((chapter) => {
                    const isInRange =
                      chapter.chapterNumber >= startChapter && chapter.chapterNumber <= endChapter;
                    const isExpanded = expandedChapters.has(chapter.id);

                    return (
                      <div key={chapter.id}>
                        <div
                          onClick={() => toggleChapter(chapter.id)}
                          className={`flex cursor-pointer items-center gap-2 rounded-lg p-2 ${
                            isInRange ? 'bg-ultrasonic-50' : 'bg-gray-50'
                          }`}
                        >
                          <ChevronDown
                            className={`h-4 w-4 text-gray-400 transition-transform ${
                              isExpanded ? '' : '-rotate-90'
                            }`}
                          />
                          <span
                            className={`text-sm font-medium ${
                              isInRange ? 'text-ultrasonic-700' : 'text-gray-600'
                            }`}
                          >
                            {chapter.chapterNumber}장. {chapter.title}
                          </span>
                          <span className="ml-auto text-xs text-gray-400">
                            {chapter.pageCount
                              ? `${chapter.startPage}~${chapter.endPage}p`
                              : `${chapter.lectureCount}강`}
                          </span>
                        </div>

                        {/* 세부 목차 */}
                        {isExpanded && chapter.sections && (
                          <div className="ml-6 space-y-1 py-1">
                            {chapter.sections.map((section) => (
                              <div
                                key={section.id}
                                className={`rounded px-2 py-1 text-xs ${
                                  isInRange ? 'text-gray-600' : 'text-gray-400'
                                }`}
                              >
                                {section.sectionNumber}. {section.title}
                                {section.pageCount && (
                                  <span className="ml-2 text-gray-400">
                                    ({section.startPage}~{section.endPage}p)
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 확인 버튼 */}
                <Button onClick={handleConfirm} className="mt-4 w-full gap-2">
                  <Check className="h-4 w-4" />이 교재로 계획 생성
                </Button>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-gray-400">
                <div className="text-center">
                  <BookOpen className="mx-auto mb-2 h-12 w-12 opacity-50" />
                  <p>왼쪽에서 교재를 선택하세요</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 계획 생성 다이얼로그 (기간 설정)
// ============================================

interface PlanCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: Material | null;
  startChapter: number;
  endChapter: number;
  onSubmit: (startDate: string, endDate: string) => void;
  isLoading?: boolean;
}

function PlanCreateDialog({
  open,
  onOpenChange,
  material,
  startChapter,
  endChapter,
  onSubmit,
  isLoading,
}: PlanCreateDialogProps) {
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const future = new Date();
    future.setMonth(future.getMonth() + 2);
    return future.toISOString().split('T')[0];
  });

  // 선택된 범위 계산
  const selectedRange = useMemo(() => {
    if (!material) return { pages: 0, lectures: 0, estimatedHours: 0 };

    const chapters = material.chapters.filter(
      (c) => c.chapterNumber >= startChapter && c.chapterNumber <= endChapter,
    );

    const pages = chapters.reduce((sum, c) => sum + (c.pageCount || 0), 0);
    const lectures = chapters.reduce((sum, c) => sum + (c.lectureCount || 0), 0);

    return { pages, lectures };
  }, [material, startChapter, endChapter]);

  // 주 단위 기반 학습 일정 계산
  const schedule = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    // 첫 월요일 찾기
    const startDay = start.getDay();
    const firstMondayOffset = startDay === 0 ? 1 : startDay === 1 ? 0 : 8 - startDay;
    const firstMonday = new Date(start);
    firstMonday.setDate(start.getDate() + firstMondayOffset);
    const totalDaysFromMonday = Math.floor(
      (end.getTime() - firstMonday.getTime()) / (1000 * 60 * 60 * 24),
    );
    const nWeeks = Math.max(1, Math.floor(totalDaysFromMonday / 7));
    const remainderDays = totalDaysFromMonday % 7;

    const totalAmount = selectedRange.pages || selectedRange.lectures;
    const weeklyTarget = Math.ceil(totalAmount / nWeeks);

    return { days, nWeeks, weeklyTarget, remainderDays };
  }, [startDate, endDate, selectedRange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(startDate, endDate);
  };

  if (!material) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>계획 기간 설정</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 선택된 교재 정보 */}
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg ${
                  material.category === 'lecture' ? 'bg-purple-100' : 'bg-blue-100'
                }`}
              >
                {material.category === 'lecture' ? (
                  <Video className="h-6 w-6 text-purple-600" />
                ) : (
                  <BookOpen className="h-6 w-6 text-blue-600" />
                )}
              </div>
              <div>
                <p className="font-medium">{material.name}</p>
                <p className="text-sm text-gray-500">
                  {startChapter}장 ~ {endChapter}장 (
                  {selectedRange.pages
                    ? `${selectedRange.pages}페이지`
                    : `${selectedRange.lectures}강`}
                  )
                </p>
              </div>
            </div>
          </div>

          {/* 기간 설정 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">시작일</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="endDate">종료일</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                required
              />
            </div>
          </div>

          {/* 자동 계산된 일정 */}
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="text-ultrasonic-500 h-4 w-4" />
              <span className="text-sm font-medium text-gray-700">자동 계산된 학습 일정</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-gray-50 p-2 text-center">
                <p className="text-xs text-gray-500">학습 기간</p>
                <p className="font-semibold">
                  {schedule.nWeeks}주
                  {schedule.remainderDays > 0 && (
                    <span className="text-xs font-normal text-gray-400">
                      {' '}
                      (+{schedule.remainderDays}일)
                    </span>
                  )}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-2 text-center">
                <p className="text-xs text-gray-500">
                  주간 할당량 ({selectedRange.pages ? 'p' : '강'})
                </p>
                <p className="font-semibold text-blue-600">{schedule.weeklyTarget}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-2 text-center">
                <p className="text-xs text-gray-500">총 분량</p>
                <p className="font-semibold">
                  {selectedRange.pages || selectedRange.lectures}
                  {selectedRange.pages ? 'p' : '강'}
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            💡 주간 루틴에 설정된 자습 시간에 자동으로 미션이 배정됩니다.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4" />
              )}
              계획 생성 및 분배
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 월간 미션 요약 카드 컴포넌트 (캘린더 상단)
// ============================================

interface MonthlyMissionSummary {
  subject: string;
  count: number;
  totalAmount: number;
  completedAmount: number;
  titles: string[];
  type: 'page' | 'lecture';
}

function MonthlyMissionSummaryCard({
  plans,
  currentMonth,
}: {
  plans: LongTermPlan[];
  currentMonth: Date;
}) {
  // 해당 월에 진행 중인 계획을 과목별로 그룹화
  const summaryBySubject = useMemo(() => {
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
    const map = new Map<
      string,
      MonthlyMissionSummary & { weeklyTarget: number; weeksInMonth: number }
    >();

    plans.forEach((plan) => {
      if (!plan.startDate || !plan.endDate) return;

      const planStart = new Date(plan.startDate);
      const planEnd = new Date(plan.endDate);
      planStart.setHours(0, 0, 0, 0);
      planEnd.setHours(23, 59, 59, 999);

      // 해당 월과 겹치는지 확인
      if (monthStart > planEnd || monthEnd < planStart) return;

      // 이 달에 걸치는 유효 기간 계산
      const effectiveStart = planStart > monthStart ? planStart : monthStart;
      const effectiveEnd = planEnd < monthEnd ? planEnd : monthEnd;
      const daysInMonth =
        Math.ceil((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const weeksInMonth = Math.max(1, Math.floor(daysInMonth / 7));

      const subject = plan.subject || '기타';
      const weeklyTarget = plan.weeklyTarget || 0;
      const monthlyTarget = weeklyTarget * weeksInMonth;
      const existing = map.get(subject) || {
        subject,
        count: 0,
        totalAmount: 0,
        completedAmount: 0,
        titles: [],
        type:
          (plan as ExtendedLongTermPlan).type === 'lecture'
            ? ('lecture' as const)
            : ('page' as const),
        weeklyTarget: 0,
        weeksInMonth: 0,
      };

      existing.count += 1;
      existing.totalAmount += monthlyTarget || plan.totalAmount || 0;
      existing.completedAmount += plan.completedAmount || 0;
      existing.weeklyTarget += weeklyTarget;
      existing.weeksInMonth = Math.max(existing.weeksInMonth, weeksInMonth);
      if (existing.titles.length < 2) {
        existing.titles.push(plan.title);
      }

      map.set(subject, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [plans, currentMonth]);

  const totalPlans = summaryBySubject.reduce((sum, s) => sum + s.count, 0);
  const totalAmount = summaryBySubject.reduce((sum, s) => sum + s.totalAmount, 0);
  const completedAmount = summaryBySubject.reduce((sum, s) => sum + s.completedAmount, 0);
  const overallProgress = totalAmount > 0 ? Math.round((completedAmount / totalAmount) * 100) : 0;

  if (totalPlans === 0) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        {/* 헤더 */}
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">월간 학습 계획 요약</h3>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-500">
              총 <span className="font-semibold text-gray-700">{totalPlans}</span>개 계획
            </span>
            <span className="text-blue-600">
              진행률 <span className="font-semibold">{overallProgress}%</span>
            </span>
          </div>
        </div>

        {/* 과목별 미션 목록 */}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {summaryBySubject.map((summary) => {
            const colors = SUBJECT_COLORS[summary.subject] || {
              bg: 'bg-gray-500',
              text: 'text-gray-600',
            };
            const progress =
              summary.totalAmount > 0
                ? Math.round((summary.completedAmount / summary.totalAmount) * 100)
                : 0;

            return (
              <div
                key={summary.subject}
                className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3"
              >
                {/* 과목 색상 바 */}
                <div
                  className={`mt-0.5 h-full w-1 flex-shrink-0 rounded-full ${colors.bg}`}
                  style={{ minHeight: '40px' }}
                />

                <div className="min-w-0 flex-1">
                  {/* 과목명 + 진행률 */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium text-white ${colors.bg}`}
                    >
                      {summary.subject}
                    </span>
                    <span className="text-xs text-gray-500">
                      {summary.weeklyTarget > 0 && (
                        <span className="mr-1 text-blue-500">
                          주간 {summary.weeklyTarget}
                          {summary.type === 'lecture' ? '강' : 'p'} ×{summary.weeksInMonth}주 =
                        </span>
                      )}
                      {summary.totalAmount}
                      {summary.type === 'lecture' ? '강' : 'p'}
                    </span>
                  </div>

                  {/* 계획 제목들 */}
                  <div className="mt-1.5 space-y-0.5">
                    {summary.titles.map((title, idx) => (
                      <p key={idx} className="truncate text-xs text-gray-600">
                        • {title}
                      </p>
                    ))}
                    {summary.count > 2 && (
                      <p className="text-xs text-gray-400">외 {summary.count - 2}개</p>
                    )}
                  </div>

                  {/* 진행 바 */}
                  <div className="mt-2">
                    <Progress value={progress} className="h-1" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// 월간 캘린더 컴포넌트
// ============================================

function MonthlyCalendar({
  plans,
  onMonthChange,
}: {
  plans: LongTermPlan[];
  onMonthChange?: (month: Date) => void;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const DAYS_KR = ['일', '월', '화', '수', '목', '금', '토'];

  const navigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
    onMonthChange?.(newDate);
  };

  // 초기 마운트 시 현재 월 알림
  useMemo(() => {
    onMonthChange?.(currentDate);
  }, []);

  const { weeks } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const weeks: Date[][] = [];
    let week: Date[] = [];

    const startDay = firstDay.getDay();
    for (let i = 0; i < startDay; i++) {
      week.push(new Date(year, month, 1 - startDay + i));
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      week.push(new Date(year, month, day));
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }

    if (week.length > 0) {
      const remaining = 7 - week.length;
      for (let i = 1; i <= remaining; i++) {
        week.push(new Date(year, month + 1, i));
      }
      weeks.push(week);
    }

    return { weeks };
  }, [currentDate]);

  const getPlansForDate = (date: Date) => {
    const dateTime = date.getTime();
    return plans.filter((plan) => {
      if (!plan.startDate || !plan.endDate) return false;
      const startDate = new Date(plan.startDate);
      const endDate = new Date(plan.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      return dateTime >= startDate.getTime() && dateTime <= endDate.getTime();
    });
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <button onClick={() => navigate('prev')} className="rounded-full p-1 hover:bg-gray-100">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h3 className="text-lg font-semibold">
            {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
          </h3>
          <button onClick={() => navigate('next')} className="rounded-full p-1 hover:bg-gray-100">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-2 grid grid-cols-7 text-center text-sm">
          {DAYS_KR.map((day, i) => (
            <div
              key={day}
              className={`py-1 font-medium ${
                i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weeks.flat().map((date, idx) => {
            const isToday = date.getTime() === today.getTime();
            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
            const dayIdx = idx % 7;
            const datePlans = getPlansForDate(date);

            return (
              <div
                key={idx}
                className={`relative flex min-h-[48px] flex-col items-center rounded p-1 ${
                  isToday
                    ? 'bg-ultrasonic-500 text-white'
                    : !isCurrentMonth
                      ? 'bg-gray-50'
                      : 'bg-white'
                }`}
              >
                <span
                  className={`text-sm ${
                    isToday
                      ? 'font-bold text-white'
                      : !isCurrentMonth
                        ? 'text-gray-300'
                        : dayIdx === 0
                          ? 'text-red-500'
                          : dayIdx === 6
                            ? 'text-blue-500'
                            : 'text-gray-700'
                  }`}
                >
                  {date.getDate()}
                </span>
                {datePlans.length > 0 && isCurrentMonth && (
                  <div className="mt-0.5 flex flex-wrap justify-center gap-0.5">
                    {datePlans.slice(0, 3).map((plan) => {
                      const colors = SUBJECT_COLORS[plan.subject ?? ''] || { bg: 'bg-gray-400' };
                      return (
                        <div
                          key={plan.id}
                          className={`h-1.5 w-1.5 rounded-full ${colors.bg}`}
                          title={plan.title}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// 계획 카드 컴포넌트
// ============================================

function PlanCard({
  plan,
  onDistribute,
  onDelete,
}: {
  plan: ExtendedLongTermPlan;
  onDistribute: () => void;
  onDelete: () => void;
}) {
  const colors = SUBJECT_COLORS[plan.subject ?? ''] || { bg: 'bg-gray-500', text: 'text-gray-600' };
  const progress =
    plan.totalAmount && plan.totalAmount > 0
      ? Math.round((plan.completedAmount / plan.totalAmount) * 100)
      : 0;

  const startDate = plan.startDate ? new Date(plan.startDate).toLocaleDateString('ko-KR') : '-';
  const endDate = plan.endDate ? new Date(plan.endDate).toLocaleDateString('ko-KR') : '-';

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* 아이콘 */}
          <div
            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg ${
              plan.type === 'lecture' ? 'bg-purple-100' : 'bg-blue-100'
            }`}
          >
            {plan.type === 'lecture' ? (
              <Video className="h-6 w-6 text-purple-600" />
            ) : (
              <BookOpen className="h-6 w-6 text-blue-600" />
            )}
          </div>

          {/* 내용 */}
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span className={`rounded px-2 py-0.5 text-xs font-medium text-white ${colors.bg}`}>
                {plan.subject}
              </span>
              <span className="text-xs text-gray-500">
                {plan.type === 'lecture' ? '강의' : '교재'}
              </span>
              {plan.isDistributed && (
                <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-600">
                  분배 완료
                </span>
              )}
            </div>
            <h3 className="font-semibold text-gray-900">{plan.title}</h3>
            {plan.material && <p className="mt-0.5 text-sm text-gray-500">{plan.material}</p>}
            <p className="mt-1 text-xs text-gray-400">
              {startDate} ~ {endDate}
              {plan.nWeeks && <span className="ml-2">· {plan.nWeeks}주</span>}
              {plan.weeklyTarget && (
                <span className="ml-1">
                  · 주간 {plan.weeklyTarget}
                  {plan.type === 'lecture' ? '강' : 'p'}
                </span>
              )}
            </p>

            {/* 진행률 */}
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-gray-500">진행률</span>
                <span className={`font-medium ${colors.text}`}>
                  {plan.completedAmount ?? 0} / {plan.totalAmount ?? 0} ({progress}%)
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex flex-col gap-2">
            {!plan.isDistributed && (
              <Button variant="outline" size="sm" onClick={onDistribute} className="gap-1">
                <Sparkles className="h-3 w-3" />
                분배
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700"
              onClick={onDelete}
            >
              삭제
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// 메인 페이지 컴포넌트
// ============================================

function PlannerPlansPage() {
  const { data: plans, isLoading } = useGetPlans();
  const { data: routines } = useGetRoutines();
  const createPlanMutation = useCreatePlanWithMaterial();
  const distributeMutation = useDistributePlan();
  const deleteMutation = useDeletePlan();

  // 다이얼로그 상태
  const [isMaterialSelectOpen, setIsMaterialSelectOpen] = useState(false);
  const [isPlanCreateOpen, setIsPlanCreateOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedStartChapter, setSelectedStartChapter] = useState(1);
  const [selectedEndChapter, setSelectedEndChapter] = useState(1);

  // 현재 월 상태 (월간 미션 요약용)
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handleMaterialSelect = (material: Material, startChapter: number, endChapter: number) => {
    setSelectedMaterial(material);
    setSelectedStartChapter(startChapter);
    setSelectedEndChapter(endChapter);
    setIsMaterialSelectOpen(false);
    setIsPlanCreateOpen(true);
  };

  const handleCreatePlan = async (startDate: string, endDate: string) => {
    if (!selectedMaterial) return;

    try {
      const newPlan = await createPlanMutation.mutateAsync({
        material: selectedMaterial,
        startChapter: selectedStartChapter,
        endChapter: selectedEndChapter,
        startDate,
        endDate,
      });

      // 자동 분배 실행
      if (routines && routines.length > 0) {
        await distributeMutation.mutateAsync({
          plan: newPlan as ExtendedLongTermPlan,
          routines,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        });
      }

      toast.success('계획이 생성되고 일정이 분배되었습니다!');
      setIsPlanCreateOpen(false);
      setSelectedMaterial(null);
    } catch {
      toast.error('계획 생성에 실패했습니다.');
    }
  };

  const handleDistribute = async (plan: ExtendedLongTermPlan) => {
    if (!routines || routines.length === 0) {
      toast.error('먼저 주간 루틴을 설정해주세요.');
      return;
    }

    try {
      await distributeMutation.mutateAsync({
        plan,
        routines,
        startDate: new Date(plan.startDate || new Date()),
        endDate: new Date(plan.endDate || new Date()),
      });
      toast.success('일정이 분배되었습니다!');
    } catch {
      toast.error('일정 분배에 실패했습니다.');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      await deleteMutation.mutateAsync(id);
      toast.success('계획이 삭제되었습니다.');
    }
  };

  // 통계
  const stats = useMemo(() => {
    if (!plans) return { total: 0, completed: 0, inProgress: 0, avgProgress: 0 };

    const completed = plans.filter(
      (p) => p.totalAmount && p.completedAmount >= p.totalAmount,
    ).length;
    const inProgress = plans.filter(
      (p) => p.totalAmount && p.completedAmount > 0 && p.completedAmount < p.totalAmount,
    ).length;
    const avgProgress =
      plans.length > 0
        ? Math.round(
            plans.reduce((sum, p) => {
              if (!p.totalAmount) return sum;
              return sum + (p.completedAmount / p.totalAmount) * 100;
            }, 0) / plans.length,
          )
        : 0;

    return { total: plans.length, completed, inProgress, avgProgress };
  }, [plans]);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-screen-xl px-4 py-6">
        <Skeleton className="mb-6 h-8 w-32" />
        <Skeleton className="mb-6 h-[400px] w-full rounded-xl" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 py-6">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="rounded-lg p-2 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">장기 계획</h1>
            <p className="mt-1 text-gray-500">교재를 선택하면 자동으로 일정이 분배됩니다</p>
          </div>
        </div>
        <Button onClick={() => setIsMaterialSelectOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          교재 선택하여 계획 추가
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-blue-100 p-2">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">전체 계획</p>
              <p className="text-xl font-bold">{stats.total}개</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-green-100 p-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">진행 중</p>
              <p className="text-xl font-bold">{stats.inProgress}개</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-purple-100 p-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">완료</p>
              <p className="text-xl font-bold">{stats.completed}개</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-orange-100 p-2">
              <Target className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">평균 진행률</p>
              <p className="text-xl font-bold">{stats.avgProgress}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 월간 미션 요약 */}
      <MonthlyMissionSummaryCard plans={plans || []} currentMonth={currentMonth} />

      {/* 월간 캘린더 */}
      <MonthlyCalendar plans={plans || []} onMonthChange={setCurrentMonth} />

      {/* 계획 목록 */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            장기 계획 목록
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {plans && plans.length > 0 ? (
          plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan as ExtendedLongTermPlan}
              onDistribute={() => handleDistribute(plan as ExtendedLongTermPlan)}
              onDelete={() => handleDelete(plan.id)}
            />
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p className="mb-2 text-gray-500">등록된 장기 계획이 없습니다.</p>
              <p className="mb-4 text-sm text-gray-400">
                교재를 선택하면 목차에서 범위를 정하고 자동으로 일정이 분배됩니다.
              </p>
              <Button onClick={() => setIsMaterialSelectOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />첫 계획 추가하기
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 교재 선택 다이얼로그 */}
      <MaterialSelectDialog
        open={isMaterialSelectOpen}
        onOpenChange={setIsMaterialSelectOpen}
        onSelect={handleMaterialSelect}
      />

      {/* 계획 생성 다이얼로그 */}
      <PlanCreateDialog
        open={isPlanCreateOpen}
        onOpenChange={setIsPlanCreateOpen}
        material={selectedMaterial}
        startChapter={selectedStartChapter}
        endChapter={selectedEndChapter}
        onSubmit={handleCreatePlan}
        isLoading={createPlanMutation.isPending || distributeMutation.isPending}
      />
    </div>
  );
}
