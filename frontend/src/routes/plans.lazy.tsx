/**
 * 장기 계획 관리 페이지
 * - 계획명, 교과/과목 선택, 기간 설정을 하나의 다이얼로그로 통합
 * - 자동 분배 기능
 */

import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { useLoginGuard } from '@/hooks/useLoginGuard';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowLeft,
  Loader2,
  BookOpen,
  MonitorPlay,
  FileText,
  Target,
  TrendingUp,
  Calendar,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import {
  useGetPlans,
  useDistributePlan,
  useGetRoutines,
  useDeletePlan,
  useGetSubjects,
  useCreatePlan,
  useSearchMaterials,
} from '@/stores/server/planner';
import { useGetTutorBoardEvents } from '@/stores/server/planner/tutorboard';
import type { ExtendedLongTermPlan } from '@/stores/server/planner/planner-types';
import { getSubjectColor, type LongTermPlan } from '@/types/planner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { CommentDialog } from '@/components/planner/CommentDialog';

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

// ============================================
// 장기 계획 설정 다이얼로그 (4탭: 교과서/참고서/인강/기타)
// ============================================

type PlanTab = 'textbook' | 'reference' | 'lecture' | 'other';

interface PlanSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    planName: string;
    description: string;
    kyokwa: string;
    subject: string;
    startDate: string;
    endDate: string;
    totalAmount: number;
    type: 'textbook' | 'lecture';
    materialId?: number;
    startPage?: number;
    endPage?: number;
  }) => void;
  isLoading?: boolean;
}

function PlanSetupDialog({ open, onOpenChange, onSubmit, isLoading }: PlanSetupDialogProps) {
  const { data: subjectsData } = useGetSubjects();
  const groups = subjectsData?.groups || [];

  const [planName, setPlanName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedKyokwa, setSelectedKyokwa] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [activeTab, setActiveTab] = useState<PlanTab>('reference');

  // 교재 검색
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

  // 범위: 시작페이지 / 끝페이지
  const [startPage, setStartPage] = useState<number | ''>('');
  const [endPage, setEndPage] = useState<number | ''>('');

  // 기타 탭 전용
  const [otherName, setOtherName] = useState('');
  const [amountUnit, setAmountUnit] = useState<'page' | 'lecture'>('page');

  // 기간
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const future = new Date();
    future.setMonth(future.getMonth() + 2);
    return future.toISOString().split('T')[0];
  });

  // 디바운스된 검색
  const searchCategory =
    activeTab === 'textbook'
      ? 'textbook'
      : activeTab === 'reference'
        ? 'reference'
        : activeTab === 'lecture'
          ? 'lecture'
          : undefined;
  const { data: searchResults } = useSearchMaterials(debouncedQuery, searchCategory);

  // 디바운스 처리
  useState(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  });

  // 검색어 변경 시 디바운스 적용
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowResults(true);
    setSelectedMaterial(null);
    // 디바운스
    setTimeout(() => setDebouncedQuery(value), 300);
  };

  // 교재 선택
  const handleSelectMaterial = (material: any) => {
    setSelectedMaterial(material);
    setSearchQuery(material.name);
    setPlanName(material.name);
    setShowResults(false);
    // 교재의 총 페이지 수가 있으면 끝 페이지에 반영
    if (material.totalPages) {
      setStartPage(1);
      setEndPage(material.totalPages);
    }
  };

  // 총 분량 계산
  const totalAmount = useMemo(() => {
    const s = typeof startPage === 'number' ? startPage : 0;
    const e = typeof endPage === 'number' ? endPage : 0;
    return Math.max(0, e - s + 1);
  }, [startPage, endPage]);

  // 선택된 교과에 속하는 과목 목록
  const availableSubjects = useMemo(() => {
    if (!selectedKyokwa) return [];
    const group = groups.find((g: any) => g.kyokwa === selectedKyokwa);
    return group?.subjects || [];
  }, [selectedKyokwa, groups]);

  // 교과 변경 시 과목 초기화
  const handleKyokwaChange = (kyokwa: string) => {
    setSelectedKyokwa(kyokwa);
    setSelectedSubject('');
  };

  // 주 단위 기반 학습 일정 계산
  const schedule = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const startDay = start.getDay();
    const firstMondayOffset = startDay === 0 ? 1 : startDay === 1 ? 0 : 8 - startDay;
    const firstMonday = new Date(start);
    firstMonday.setDate(start.getDate() + firstMondayOffset);
    const totalDaysFromMonday = Math.floor(
      (end.getTime() - firstMonday.getTime()) / (1000 * 60 * 60 * 24),
    );
    const nWeeks = Math.max(1, Math.floor(totalDaysFromMonday / 7));
    const remainderDays = totalDaysFromMonday % 7;
    const amt = totalAmount > 0 ? totalAmount : 1;
    const weeklyTarget = Math.ceil(amt / nWeeks);

    return { days, nWeeks, weeklyTarget, remainderDays };
  }, [startDate, endDate, totalAmount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === 'other') {
      if (!otherName.trim()) {
        toast.error('교재/강의명을 입력해주세요.');
        return;
      }
    } else {
      if (!selectedMaterial && !searchQuery.trim()) {
        toast.error('교재를 검색하여 선택하거나 이름을 직접 입력해주세요.');
        return;
      }
    }

    if (!selectedKyokwa) {
      toast.error('교과를 선택해주세요.');
      return;
    }
    if (!selectedSubject) {
      toast.error('과목을 선택해주세요.');
      return;
    }
    if (typeof startPage !== 'number' || typeof endPage !== 'number' || totalAmount <= 0) {
      toast.error('범위를 올바르게 입력해주세요.');
      return;
    }

    if (!planName.trim()) {
      toast.error('제목을 입력해주세요.');
      return;
    }

    const isLecture = activeTab === 'lecture' || amountUnit === 'lecture';

    onSubmit({
      planName: planName.trim(),
      description: description.trim(),
      kyokwa: selectedKyokwa,
      subject: selectedSubject,
      startDate,
      endDate,
      totalAmount,
      type: isLecture ? 'lecture' : 'textbook',
      materialId: selectedMaterial?.id,
      startPage: typeof startPage === 'number' ? startPage : undefined,
      endPage: typeof endPage === 'number' ? endPage : undefined,
    });
  };

  // 다이얼로그 열릴 때 / 닫힐 때 상태 초기화
  const resetForm = () => {
    setPlanName('');
    setDescription('');
    setSelectedKyokwa('');
    setSelectedSubject('');
    setSearchQuery('');
    setDebouncedQuery('');
    setSelectedMaterial(null);
    setStartPage('');
    setEndPage('');
    setOtherName('');
    setAmountUnit('page');
    setActiveTab('reference');
    setShowResults(false);
    const today = new Date();
    setStartDate(today.toISOString().split('T')[0]);
    const future = new Date();
    future.setMonth(future.getMonth() + 2);
    setEndDate(future.toISOString().split('T')[0]);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  const tabItems: { key: PlanTab; label: string; icon: React.ReactNode }[] = [
    { key: 'textbook', label: '교과서', icon: <BookOpen className="h-3.5 w-3.5" /> },
    { key: 'reference', label: '참고서', icon: <FileText className="h-3.5 w-3.5" /> },
    { key: 'lecture', label: '인강', icon: <MonitorPlay className="h-3.5 w-3.5" /> },
    { key: 'other', label: '기타', icon: <Target className="h-3.5 w-3.5" /> },
  ];

  // 탭 변경 시 검색 초기화
  const handleTabChange = (tab: PlanTab) => {
    setActiveTab(tab);
    setSearchQuery('');
    setDebouncedQuery('');
    setSelectedMaterial(null);
    setStartPage('');
    setEndPage('');
    setShowResults(false);
  };

  const unitLabel = activeTab === 'lecture' ? '강' : '페이지';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-lg">장기 계획 설정</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ===== 1. 제목 ===== */}
          <div>
            <Label htmlFor="planTitle" className="text-sm font-semibold text-gray-700">
              제목
            </Label>
            <Input
              id="planTitle"
              placeholder="계획 제목을 입력하세요"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className="mt-1.5"
              required
            />
          </div>

          {/* ===== 2. 내용 ===== */}
          <div>
            <Label htmlFor="planDescription" className="text-sm font-semibold text-gray-700">
              내용
            </Label>
            <textarea
              id="planDescription"
              placeholder="계획에 대한 설명을 입력하세요"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* ===== 3. 기간 ===== */}
          <div>
            <Label className="text-sm font-semibold text-gray-700">기간</Label>
            <div className="mt-1.5 grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="text-xs text-gray-500">
                  시작일
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="text-xs text-gray-500">
                  종료일
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="mt-1"
                  required
                />
              </div>
            </div>
          </div>

          {/* ===== 4. 교과/과목 선택 ===== */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="kyokwa" className="text-sm font-semibold text-gray-700">
                교과 선택
              </Label>
              <select
                id="kyokwa"
                value={selectedKyokwa}
                onChange={(e) => handleKyokwaChange(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="">교과를 선택하세요</option>
                {groups.map((g: any) => (
                  <option key={g.kyokwaCode || g.kyokwa} value={g.kyokwa}>
                    {g.kyokwa}
                  </option>
                ))}
              </select>
              {subjectsData?.curriculum && (
                <p className="mt-1 text-[10px] text-gray-400">
                  {subjectsData.curriculum} 교육과정 적용
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="subject" className="text-sm font-semibold text-gray-700">
                과목 선택
              </Label>
              <select
                id="subject"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                disabled={!selectedKyokwa}
                required
              >
                <option value="">
                  {selectedKyokwa ? '과목을 선택하세요' : '교과를 먼저 선택'}
                </option>
                {availableSubjects.map((s: any) => (
                  <option key={s.id || s.subjectName} value={s.subjectName}>
                    {s.subjectName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ===== 5. 교과서/참고서/인강/기타 탭 ===== */}
          <div>
            <div className="flex border-b border-gray-200">
              {tabItems.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 탭 내용 */}
            <div className="min-h-[80px] pt-4">
              {/* ===== 교과서/참고서/인강 탭: 입력 자동검색 ===== */}
              {activeTab !== 'other' && (
                <div className="space-y-3">
                  <div className="relative">
                    <Label className="text-sm font-semibold text-gray-700">
                      {activeTab === 'textbook'
                        ? '교과서'
                        : activeTab === 'reference'
                          ? '참고서'
                          : '인강'}
                    </Label>
                    <Input
                      placeholder={`${activeTab === 'textbook' ? '교과서' : activeTab === 'reference' ? '참고서' : '인강'}명을 입력하면 자동 검색됩니다`}
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      onFocus={() => searchQuery.length >= 1 && setShowResults(true)}
                      className="mt-1.5"
                    />
                    {/* 검색 결과 드롭다운 */}
                    {showResults && debouncedQuery.length >= 1 && (
                      <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                        {searchResults &&
                          searchResults.length > 0 &&
                          searchResults.map((m: any) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => handleSelectMaterial(m)}
                              className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-blue-50 focus:bg-blue-50"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium text-gray-800">{m.name}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  {m.publisher && <span>{m.publisher}</span>}
                                  {m.totalPages && <span>{m.totalPages}p</span>}
                                </div>
                              </div>
                            </button>
                          ))}
                        {/* 직접 입력 옵션 */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMaterial({ name: searchQuery.trim(), isManual: true });
                            setPlanName(searchQuery.trim());
                            setShowResults(false);
                          }}
                          className="flex w-full items-center gap-2 border-t border-gray-100 px-3 py-2.5 text-left text-sm hover:bg-green-50"
                        >
                          <span className="text-green-500">+</span>
                          <span className="text-gray-700">
                            "<span className="font-medium">{searchQuery.trim()}</span>" 직접 입력
                          </span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 선택된 교재 표시 */}
                  {selectedMaterial && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-blue-800">
                            {selectedMaterial.name}
                          </p>
                          <p className="text-xs text-blue-600">
                            {selectedMaterial.isManual ? (
                              '직접 입력'
                            ) : (
                              <>
                                {selectedMaterial.publisher && `${selectedMaterial.publisher} · `}
                                {selectedMaterial.totalPages &&
                                  `총 ${selectedMaterial.totalPages}p`}
                              </>
                            )}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMaterial(null);
                            setSearchQuery('');
                            setStartPage('');
                            setEndPage('');
                          }}
                          className="text-xs text-blue-500 hover:text-blue-700"
                        >
                          변경
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ===== 기타 탭: 직접 입력 ===== */}
              {activeTab === 'other' && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">
                      교재/강의명 (직접 입력)
                    </Label>
                    <Input
                      placeholder="예: 수학의 정석 기본편"
                      value={otherName}
                      onChange={(e) => setOtherName(e.target.value)}
                      className="mt-1.5"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-semibold text-gray-700">단위</Label>
                    <div className="flex rounded-md border border-gray-300">
                      <button
                        type="button"
                        onClick={() => setAmountUnit('page')}
                        className={`px-3 py-1.5 text-sm transition-colors ${
                          amountUnit === 'page'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                        } rounded-l-md`}
                      >
                        페이지
                      </button>
                      <button
                        type="button"
                        onClick={() => setAmountUnit('lecture')}
                        className={`px-3 py-1.5 text-sm transition-colors ${
                          amountUnit === 'lecture'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                        } rounded-r-md border-l`}
                      >
                        강의
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ===== 6. 범위 입력: 시작/끝 + 총분량 ===== */}
          <div>
            <Label className="text-sm font-semibold text-gray-700">범위</Label>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1">
                <Input
                  type="number"
                  min={1}
                  placeholder="시작"
                  value={startPage}
                  onChange={(e) => setStartPage(e.target.value ? Number(e.target.value) : '')}
                  className="text-center"
                />
                <p className="mt-0.5 text-center text-[10px] text-gray-400">
                  시작 {activeTab === 'lecture' || amountUnit === 'lecture' ? '강' : 'p'}
                </p>
              </div>
              <span className="text-gray-400">~</span>
              <div className="flex-1">
                <Input
                  type="number"
                  min={typeof startPage === 'number' ? startPage : 1}
                  placeholder="끝"
                  value={endPage}
                  onChange={(e) => setEndPage(e.target.value ? Number(e.target.value) : '')}
                  className="text-center"
                />
                <p className="mt-0.5 text-center text-[10px] text-gray-400">
                  끝 {activeTab === 'lecture' || amountUnit === 'lecture' ? '강' : 'p'}
                </p>
              </div>
              <span className="text-gray-400">=</span>
              <div className="w-20 flex-shrink-0 rounded-lg bg-blue-50 px-3 py-2 text-center">
                <p className="text-lg font-bold text-blue-600">
                  {totalAmount > 0 ? totalAmount : '-'}
                </p>
                <p className="text-[10px] text-blue-400">총분량</p>
              </div>
            </div>
          </div>

          {/* ===== 7. 자동 주간 할당 ===== */}
          {totalAmount > 0 && (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="text-ultrasonic-500 h-4 w-4" />
                <span className="text-sm font-medium text-gray-700">자동 주간 할당</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
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
                  <p className="text-xs text-gray-500">주간 할당량</p>
                  <p className="font-semibold text-blue-600">
                    {schedule.weeklyTarget}
                    {activeTab === 'lecture' || amountUnit === 'lecture' ? '강' : 'p'}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-2 text-center">
                  <p className="text-xs text-gray-500">총 분량</p>
                  <p className="font-semibold">
                    {totalAmount}
                    {activeTab === 'lecture' || amountUnit === 'lecture' ? '강' : 'p'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ===== 8. 취소 / 계획 생성 버튼 ===== */}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4" />
              )}
              계획 생성
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 월간 캘린더 컴포넌트
// ============================================

function MonthlyCalendar({ plans }: { plans: LongTermPlan[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 튜터보드 일정 가져오기
  const { data: tbEvents } = useGetTutorBoardEvents();

  // 날짜별 튜터보드 이벤트 필터링
  const getTbEventsForDate = (date: Date) => {
    if (!tbEvents) return [];

    // YYYY-MM-DD 포맷 비교
    const dateStr = date.toISOString().split('T')[0];

    const assignments = tbEvents.assignments.filter((a) => a.date && a.date.startsWith(dateStr));
    const tests = tbEvents.tests.filter((t) => t.date && t.date.startsWith(dateStr));

    return [...assignments, ...tests];
  };

  const DAYS_KR = ['일', '월', '화', '수', '목', '금', '토'];

  const navigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

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

  // Gantt 바: 이번 달 캘린더 그리드에 겹치는 장기계획 바 계산
  const ganttBars = useMemo(() => {
    if (!weeks.length) return [];
    const firstCellDate = new Date(weeks[0][0]);
    firstCellDate.setHours(0, 0, 0, 0);
    const lastCellDate = new Date(weeks[weeks.length - 1][6]);
    lastCellDate.setHours(23, 59, 59, 999);
    const totalCells = weeks.length * 7;

    return plans
      .filter((plan) => {
        if (!plan.startDate || !plan.endDate) return false;
        const ps = new Date(plan.startDate);
        const pe = new Date(plan.endDate);
        ps.setHours(0, 0, 0, 0);
        pe.setHours(23, 59, 59, 999);
        return ps <= lastCellDate && pe >= firstCellDate;
      })
      .map((plan) => {
        const ps = new Date(plan.startDate!);
        const pe = new Date(plan.endDate!);
        ps.setHours(0, 0, 0, 0);
        pe.setHours(0, 0, 0, 0);

        const visibleStart = ps >= firstCellDate ? ps : firstCellDate;
        const visibleEnd = pe <= lastCellDate ? pe : lastCellDate;

        const startIdx = Math.round(
          (visibleStart.getTime() - firstCellDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        const endIdx = Math.round(
          (visibleEnd.getTime() - firstCellDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        const clampedStart = Math.max(0, Math.min(startIdx, totalCells - 1));
        const clampedEnd = Math.max(clampedStart, Math.min(endIdx, totalCells - 1));

        const progress =
          plan.totalAmount > 0 ? Math.round((plan.completedAmount / plan.totalAmount) * 100) : 0;

        // 여러 주에 걸치는 바를 주(row) 별로 분할
        const segments: {
          row: number;
          colStart: number;
          colEnd: number;
        }[] = [];

        const startRow = Math.floor(clampedStart / 7);
        const endRow = Math.floor(clampedEnd / 7);

        for (let row = startRow; row <= endRow; row++) {
          const rowStart = row * 7;
          const rowEnd = row * 7 + 6;
          const segColStart = Math.max(clampedStart, rowStart) - rowStart;
          const segColEnd = Math.min(clampedEnd, rowEnd) - rowStart;
          segments.push({ row, colStart: segColStart, colEnd: segColEnd });
        }

        return {
          plan,
          segments,
          progress,
          color: getSubjectColor(plan.subject || '기타'),
          startsBeforeGrid: ps < firstCellDate,
          endsAfterGrid: pe > lastCellDate,
        };
      });
  }, [plans, weeks]);

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

        {/* 범례 추가 */}
        <div className="mb-2 flex items-center justify-end gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-orange-500"></span> 과제
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500"></span> 시험
          </span>
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

        {/* 날짜 그리드 + Gantt 바 통합 */}
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="mb-1">
            {/* 날짜 행 */}
            <div className="grid grid-cols-7 gap-1">
              {week.map((date, dayIdx) => {
                const isToday = date.getTime() === today.getTime();
                const isCurrentMonth = date.getMonth() === currentDate.getMonth();

                return (
                  <div
                    key={dayIdx}
                    className={`relative flex min-h-[36px] flex-col items-center rounded p-1 ${
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

                    {/* 튜터보드 이벤트 (과제/시험) */}
                    {isCurrentMonth &&
                      getTbEventsForDate(date).map((event) => (
                        <div
                          key={`${event.type}-${event.id}`}
                          className={`group relative mt-0.5 w-full cursor-help truncate rounded border px-0.5 py-px text-[10px] font-medium ${
                            event.type === 'test'
                              ? 'border-red-200 bg-red-50 text-red-700'
                              : 'border-orange-200 bg-orange-50 text-orange-700'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <span
                              className={`inline-block h-1 w-1 rounded-full ${event.type === 'test' ? 'bg-red-500' : 'bg-orange-500'}`}
                            ></span>
                            <span className="truncate">{event.title}</span>
                          </div>
                          <div className="pointer-events-none absolute left-0 top-full z-10 hidden w-max max-w-[200px] rounded-lg border bg-white p-2 text-gray-800 shadow-lg group-hover:block">
                            <p className="text-xs font-bold">{event.title}</p>
                            <p className="text-[10px] text-gray-500">{event.lessonTitle}</p>
                            <p className="text-[10px] text-gray-400">{event.className}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                );
              })}
            </div>

            {/* Gantt 바: 이 주(row)에 해당하는 세그먼트 */}
            {ganttBars.some((b) => b.segments.some((s) => s.row === weekIdx)) && (
              <div className="mt-0.5 space-y-0.5">
                {ganttBars
                  .filter((b) => b.segments.some((s) => s.row === weekIdx))
                  .map((bar) => {
                    const seg = bar.segments.find((s) => s.row === weekIdx)!;
                    // CSS grid: col-start / col-end (1-indexed)
                    const gridColumn = `${seg.colStart + 1} / ${seg.colEnd + 2}`;
                    const isStart = bar.segments[0] === seg && !bar.startsBeforeGrid;
                    const isEnd =
                      bar.segments[bar.segments.length - 1] === seg && !bar.endsAfterGrid;

                    return (
                      <div key={bar.plan.id} className="grid grid-cols-7 gap-1">
                        <div
                          className={`group relative flex cursor-default items-center gap-1 overflow-hidden border-y border-r px-1.5 py-[3px] text-[10px] font-medium text-gray-700 transition-all hover:shadow-sm ${
                            isStart && isEnd
                              ? 'rounded-md border-l-0'
                              : isStart
                                ? 'rounded-l-md border-l-0'
                                : isEnd
                                  ? 'rounded-r-md'
                                  : ''
                          }`}
                          style={{
                            gridColumn,
                            backgroundColor: `${bar.color}18`,
                            borderColor: `${bar.color}30`,
                            borderLeftWidth: isStart ? '3px' : undefined,
                            borderLeftColor: isStart ? bar.color : undefined,
                            borderLeftStyle: isStart ? 'solid' : undefined,
                          }}
                        >
                          <span
                            className="mr-0.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                            style={{ backgroundColor: bar.color }}
                          />
                          <span className="truncate">{bar.plan.title}</span>
                          {bar.progress > 0 && (
                            <span
                              className="ml-auto flex-shrink-0 rounded px-0.5 text-[9px] font-semibold"
                              style={{ color: bar.color }}
                            >
                              {bar.progress}%
                            </span>
                          )}

                          {/* 호버 툴팁 */}
                          <div className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden w-max max-w-[220px] rounded-lg border bg-white p-2.5 text-gray-800 shadow-xl group-hover:block">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="inline-block h-2.5 w-2.5 rounded"
                                style={{ backgroundColor: bar.color }}
                              />
                              <p className="text-xs font-bold">{bar.plan.title}</p>
                            </div>
                            <div className="mt-1.5 space-y-0.5">
                              <p className="text-[10px] text-gray-500">
                                과목:{' '}
                                <span className="font-medium text-gray-700">
                                  {bar.plan.subject || '기타'}
                                </span>
                              </p>
                              <p className="text-[10px] text-gray-500">
                                기간:{' '}
                                {bar.plan.startDate
                                  ? new Date(bar.plan.startDate).toLocaleDateString('ko-KR')
                                  : '-'}{' '}
                                ~{' '}
                                {bar.plan.endDate
                                  ? new Date(bar.plan.endDate).toLocaleDateString('ko-KR')
                                  : '-'}
                              </p>
                              <p className="text-[10px] text-gray-500">
                                진행: {bar.plan.completedAmount ?? 0} / {bar.plan.totalAmount ?? 0}{' '}
                                ({bar.progress}%)
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        ))}
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
  onComment,
}: {
  plan: ExtendedLongTermPlan;
  onDistribute: () => void;
  onDelete: () => void;
  onComment: () => void;
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
              <MonitorPlay className="h-6 w-6 text-purple-600" />
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
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-indigo-50 hover:text-indigo-500"
              title="코멘트"
              onClick={onComment}
            >
              <MessageSquare className="h-4 w-4" />
            </button>
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
  const createPlanMutation = useCreatePlan();
  const distributeMutation = useDistributePlan();
  const deleteMutation = useDeletePlan();

  // 다이얼로그 상태
  const [isPlanSetupOpen, setIsPlanSetupOpen] = useState(false);
  const { guard, LoginGuardModal } = useLoginGuard();

  // 코멘트 다이얼로그 상태
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentTarget, setCommentTarget] = useState<LongTermPlan | null>(null);

  const handleCreatePlan = async (data: {
    planName: string;
    description: string;
    kyokwa: string;
    subject: string;
    startDate: string;
    endDate: string;
    totalAmount: number;
    type: 'textbook' | 'lecture';
  }) => {
    try {
      const newPlan = await createPlanMutation.mutateAsync({
        title: data.planName,
        type: data.type,
        subject: data.subject,
        startDate: data.startDate,
        endDate: data.endDate,
        totalAmount: data.totalAmount,
        completedAmount: 0,
        weeklyTarget: 0,
      });

      toast.success('계획이 생성되었습니다!');
      setIsPlanSetupOpen(false);
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
            <p className="mt-1 text-gray-500">계획을 세우고 일정을 관리하세요</p>
          </div>
        </div>
        <Button onClick={() => guard(() => setIsPlanSetupOpen(true))} className="gap-2">
          <Plus className="h-4 w-4" />
          장기계획 세우기
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

      {/* 월간 캘린더 */}
      <MonthlyCalendar plans={plans || []} />

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
              onDistribute={() => guard(() => handleDistribute(plan as ExtendedLongTermPlan))}
              onDelete={() => guard(() => handleDelete(plan.id))}
              onComment={() => {
                setCommentTarget(plan);
                setCommentOpen(true);
              }}
            />
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p className="mb-2 text-gray-500">등록된 장기 계획이 없습니다.</p>
              <p className="mb-4 text-sm text-gray-400">
                계획명, 교과, 과목을 선택하고 기간을 설정하여 장기 계획을 시작하세요.
              </p>
              <Button onClick={() => guard(() => setIsPlanSetupOpen(true))} className="gap-2">
                <Plus className="h-4 w-4" />첫 계획 추가하기
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 장기 계획 설정 다이얼로그 */}
      <PlanSetupDialog
        open={isPlanSetupOpen}
        onOpenChange={setIsPlanSetupOpen}
        onSubmit={handleCreatePlan}
        isLoading={createPlanMutation.isPending}
      />

      {LoginGuardModal}

      {/* 코멘트 다이얼로그 */}
      {commentTarget && (
        <CommentDialog
          open={commentOpen}
          onOpenChange={setCommentOpen}
          target={{
            studentId: 1,
            planId: commentTarget.id,
            title: commentTarget.title,
            subject: commentTarget.subject,
          }}
        />
      )}
    </div>
  );
}
