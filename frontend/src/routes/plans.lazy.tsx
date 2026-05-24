/**
 * 장기 계획 관리 페이지
 * - 계획명, 교과/과목 선택, 기간 설정을 하나의 다이얼로그로 통합
 * - 자동 분배 기능
 */

import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { EmptyState } from '@/components/onboarding/EmptyState';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useLoginGuard } from '@/hooks/useLoginGuard';
import {
  ChevronLeft,
  Plus,
  Loader2,
  BookOpen,
  MonitorPlay,
  FileText,
  Target,
  Sparkles,
  MessageSquare,
  BarChart3,
  Trash2,
  Pencil,
} from 'lucide-react';
import {
  useGetPlans,
  useDistributePlan,
  useGetRoutines,
  useDeletePlan,
  useGetSubjects,
  useCreatePlan,
  useUpdatePlan,
  useSearchMaterials,
  useSearchAladinMaterials,
} from '@/stores/server/planner';
import type { ExtendedLongTermPlan } from '@/stores/server/planner/planner-types';
import { getSubjectColor, type LongTermPlan } from '@/types/planner';
import {
  useGetSchoolEvents,
  useGetLinkedSchool,
  useGetDayTimetable,
  PERIOD_TIMES,
  type SchoolEvent,
  type TimetableItem,
} from '@/stores/server/planner/school-schedule';
import { useSchoolDisplayPrefs } from '@/stores/client';
import { env } from '@/lib/config/env';
import { Button } from 'geobuk-shared/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from 'geobuk-shared/ui';
import { Input } from 'geobuk-shared/ui';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { CommentDialog } from '@/components/planner/CommentDialog';

export const Route = createLazyFileRoute('/plans')({
  component: PlannerPlansPage,
});

// ============================================
// 상수
// ============================================

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
  const [materialError, setMaterialError] = useState(''); // 교재 인라인 오류

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
  const isBookSearch = activeTab === 'textbook' || activeTab === 'reference';

  // 자체 DB 검색 (인강 등)
  const { data: internalSearchResults } = useSearchMaterials(
    !isBookSearch ? debouncedQuery : '',
    activeTab === 'lecture' ? 'lecture' : undefined,
  );

  // 알라딘 API 검색 (교재/참고서)
  const { data: aladinSearchResults } = useSearchAladinMaterials(
    isBookSearch ? debouncedQuery : '',
  );

  const searchResults = isBookSearch ? aladinSearchResults : internalSearchResults;

  // 디바운스 처리
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 검색어 변경 시 디바운스 적용
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowResults(true);
    setSelectedMaterial(null);
    if (materialError) setMaterialError('');
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
        setMaterialError('교재를 검색하여 선택하거나 이름을 직접 입력해주세요.');
        return;
      }
      setMaterialError('');
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

          {/* ===== 2. 내용 (선택) ===== */}
          <div>
            <Label htmlFor="planDescription" className="text-sm font-semibold text-gray-700">
              내용 <span className="ml-1 text-xs font-normal text-gray-400">(선택)</span>
            </Label>
            <textarea
              id="planDescription"
              placeholder="메모, 목표, 진행 방법 등을 적어두면 좋아요"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* ===== 3. 기간 ===== */}
          <div>
            <div className="flex items-baseline justify-between">
              <Label className="text-sm font-semibold text-gray-700">기간</Label>
              <span className="text-xs font-medium text-blue-500">
                총 {schedule.nWeeks}주
                {schedule.remainderDays > 0 && (
                  <span className="text-gray-400"> +{schedule.remainderDays}일</span>
                )}
              </span>
            </div>
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
                      className={`mt-1.5 ${materialError ? 'border-red-400 focus-visible:ring-red-200' : ''}`}
                    />
                    {materialError && (
                      <p className="mt-1 text-xs font-medium text-red-500">{materialError}</p>
                    )}
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
                              className="flex w-full items-start gap-3 px-3 py-2 text-left text-sm hover:bg-blue-50 focus:bg-blue-50"
                            >
                              {m.cover && (
                                <img
                                  src={m.cover}
                                  alt={m.name}
                                  className="h-14 w-10 flex-shrink-0 rounded-sm object-cover shadow-sm"
                                />
                              )}
                              <div className="min-w-0 flex-1 py-0.5">
                                <p className="line-clamp-1 font-medium text-gray-800">{m.name}</p>
                                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-500">
                                  {m.author && <span className="line-clamp-1">{m.author}</span>}
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
                    <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                      <div className="flex items-start gap-4">
                        {selectedMaterial.cover && (
                          <img
                            src={selectedMaterial.cover}
                            alt={selectedMaterial.name}
                            className="h-24 w-16 flex-shrink-0 rounded-md object-cover shadow-md"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold leading-tight text-blue-900">
                            {selectedMaterial.name}
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-blue-700">
                            {selectedMaterial.isManual ? (
                              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 font-medium">
                                직접 입력
                              </span>
                            ) : (
                              <>
                                {selectedMaterial.author && (
                                  <span className="opacity-80">{selectedMaterial.author}</span>
                                )}
                                {selectedMaterial.publisher && (
                                  <span className="opacity-80">· {selectedMaterial.publisher}</span>
                                )}
                                {selectedMaterial.totalPages && (
                                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 font-medium">
                                    총 {selectedMaterial.totalPages}p
                                  </span>
                                )}
                              </>
                            )}
                          </div>

                          {/* 수동 범위 입력 안내 메시지 */}
                          <p className="mt-3 rounded-md bg-blue-100/50 p-2 text-xs text-blue-600/80">
                            책의 목차를 보고 오늘부터 공부할 <strong>시작 페이지</strong>와{' '}
                            <strong>끝 페이지</strong>를 아래에 입력해 주세요.
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
                          className="flex-shrink-0 rounded-md border border-blue-100 bg-white px-2 py-1 text-xs font-medium text-blue-500 shadow-sm hover:text-blue-700"
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
            <Label className="text-sm font-semibold text-gray-700">
              범위
              <span className="ml-1 text-xs font-normal text-gray-400">
                {activeTab === 'lecture' || amountUnit === 'lecture'
                  ? '(강의 번호)'
                  : '(페이지 번호)'}
              </span>
            </Label>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1">
                <Input
                  type="number"
                  min={1}
                  placeholder={
                    activeTab === 'lecture' || amountUnit === 'lecture' ? '시작 강' : '시작 p'
                  }
                  value={startPage}
                  onChange={(e) => setStartPage(e.target.value ? Number(e.target.value) : '')}
                  className="text-center"
                />
              </div>
              <span className="text-gray-400">~</span>
              <div className="flex-1">
                <Input
                  type="number"
                  min={typeof startPage === 'number' ? startPage : 1}
                  placeholder={
                    activeTab === 'lecture' || amountUnit === 'lecture' ? '끝 강' : '끝 p'
                  }
                  value={endPage}
                  onChange={(e) => setEndPage(e.target.value ? Number(e.target.value) : '')}
                  className="text-center"
                />
              </div>
              <span className="text-gray-400">=</span>
              <div className="w-24 flex-shrink-0 rounded-lg bg-blue-50 px-3 py-2 text-center">
                <p className="text-lg font-bold leading-none text-blue-600">
                  {totalAmount > 0 ? totalAmount : '-'}
                  <span className="ml-0.5 text-xs font-semibold">
                    {totalAmount > 0
                      ? activeTab === 'lecture' || amountUnit === 'lecture'
                        ? '강'
                        : 'p'
                      : ''}
                  </span>
                </p>
                <p className="mt-0.5 text-[10px] text-blue-400">총분량</p>
              </div>
            </div>
          </div>

          {/* ===== 7. 자동 주간 할당 ===== */}
          {totalAmount > 0 && (
            <div className="rounded-lg border border-dashed border-indigo-200 bg-indigo-50/40 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-medium text-gray-700">자동 주간 할당</span>
              </div>
              <p className="mb-3 text-xs leading-relaxed text-gray-600">
                이 페이스로 진행하면{' '}
                <strong className="text-indigo-600">
                  매주 {schedule.weeklyTarget}
                  {activeTab === 'lecture' || amountUnit === 'lecture' ? '강' : 'p'}
                </strong>
                씩 {schedule.nWeeks}주에 걸쳐 완료합니다.
              </p>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg bg-white p-2 text-center shadow-sm">
                  <p className="text-xs text-gray-500">학습 기간</p>
                  <p className="font-semibold">
                    {schedule.nWeeks}주
                    {schedule.remainderDays > 0 && (
                      <span className="text-xs font-normal text-gray-400">
                        {' '}
                        +{schedule.remainderDays}일
                      </span>
                    )}
                  </p>
                </div>
                <div className="rounded-lg bg-white p-2 text-center shadow-sm">
                  <p className="text-xs text-gray-500">주간 할당량</p>
                  <p className="font-semibold text-indigo-600">
                    {schedule.weeklyTarget}
                    {activeTab === 'lecture' || amountUnit === 'lecture' ? '강' : 'p'}
                  </p>
                </div>
                <div className="rounded-lg bg-white p-2 text-center shadow-sm">
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
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              className="text-gray-500"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="gap-2 bg-indigo-500 px-5 hover:bg-indigo-600"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              계획 만들기
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 장기 계획 수정 다이얼로그
// ============================================

interface EditPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: ExtendedLongTermPlan;
  onSubmit: (data: Partial<ExtendedLongTermPlan>) => void;
  isLoading?: boolean;
}

function EditPlanDialog({ open, onOpenChange, plan, onSubmit, isLoading }: EditPlanDialogProps) {
  const { data: subjectsData } = useGetSubjects();
  const groups = subjectsData?.groups || [];

  const [title, setTitle] = useState(plan.title || '');
  const [selectedKyokwa, setSelectedKyokwa] = useState(() => {
    const group = groups.find((g: any) =>
      g.subjects?.some((s: any) => s.subjectName === plan.subject),
    );
    return group?.kyokwa || '';
  });
  const [selectedSubject, setSelectedSubject] = useState(plan.subject || '');
  const [startDate, setStartDate] = useState(plan.startDate || '');
  const [endDate, setEndDate] = useState(plan.endDate || '');
  const [startPage, setStartPage] = useState<number | ''>(plan.startPage ?? '');
  const [endPage, setEndPage] = useState<number | ''>(
    plan.endPage ?? (plan.startPage != null ? plan.startPage + plan.totalAmount - 1 : ''),
  );

  // 교과 변경 시 과목 초기화
  const availableSubjects = useMemo(() => {
    if (!selectedKyokwa) return [];
    const group = groups.find((g: any) => g.kyokwa === selectedKyokwa);
    return group?.subjects || [];
  }, [selectedKyokwa, groups]);

  const totalAmount = useMemo(() => {
    const s = typeof startPage === 'number' ? startPage : 0;
    const e = typeof endPage === 'number' ? endPage : 0;
    return Math.max(0, e - s + 1);
  }, [startPage, endPage]);

  // 교과 목록이 로드되면 현재 과목의 교과를 자동으로 찾기
  useEffect(() => {
    if (groups.length > 0 && !selectedKyokwa && plan.subject) {
      const group = groups.find((g: any) =>
        g.subjects?.some((s: any) => s.subjectName === plan.subject),
      );
      if (group) setSelectedKyokwa(group.kyokwa);
    }
  }, [groups, plan.subject, selectedKyokwa]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('제목을 입력해주세요.');
      return;
    }
    onSubmit({
      title: title.trim(),
      subject: selectedSubject || plan.subject,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      totalAmount: totalAmount > 0 ? totalAmount : plan.totalAmount,
      startPage: typeof startPage === 'number' ? startPage : plan.startPage,
      endPage: typeof endPage === 'number' ? endPage : plan.endPage,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-lg">계획 수정</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="editTitle" className="text-sm font-semibold text-gray-700">
              제목
            </Label>
            <Input
              id="editTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold text-gray-700">교과</Label>
              <select
                value={selectedKyokwa}
                onChange={(e) => {
                  setSelectedKyokwa(e.target.value);
                  setSelectedSubject('');
                }}
                className="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">교과 선택</option>
                {groups.map((g: any) => (
                  <option key={g.kyokwaCode || g.kyokwa} value={g.kyokwa}>
                    {g.kyokwa}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-700">과목</Label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={!selectedKyokwa}
                className="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">{selectedKyokwa ? '과목 선택' : '교과 먼저 선택'}</option>
                {availableSubjects.map((s: any) => (
                  <option key={s.id || s.subjectName} value={s.subjectName}>
                    {s.subjectName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold text-gray-700">시작일</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-700">종료일</Label>
              <Input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold text-gray-700">범위 (페이지/강)</Label>
            <div className="mt-1.5 flex items-center gap-2">
              <Input
                type="number"
                min={1}
                placeholder="시작"
                value={startPage}
                onChange={(e) => setStartPage(e.target.value ? Number(e.target.value) : '')}
                className="text-center"
              />
              <span className="text-gray-400">~</span>
              <Input
                type="number"
                min={typeof startPage === 'number' ? startPage : 1}
                placeholder="끝"
                value={endPage}
                onChange={(e) => setEndPage(e.target.value ? Number(e.target.value) : '')}
                className="text-center"
              />
              <div className="w-20 flex-shrink-0 rounded-lg bg-blue-50 px-3 py-2 text-center">
                <p className="text-lg font-bold text-blue-600">
                  {totalAmount > 0 ? totalAmount : plan.totalAmount}
                </p>
                <p className="text-[10px] text-blue-400">총분량</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              저장
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 간트 타임라인 컴포넌트
// ============================================

const LABEL_W = 80; // 과목 라벨 고정 너비(px)
const COL_MIN_PX = 28; // 컬럼 최소 너비(px)

// 뷰 모드 — 컬럼 단위와 한 화면에 보일 컬럼 개수
type ColumnUnit = 'month' | 'week' | 'day';

const VIEW_MODES = [
  { id: 'month', label: '월별', unit: 'month' as ColumnUnit, count: 12 },
  { id: 'week', label: '주별', unit: 'week' as ColumnUnit, count: 13 },
  { id: 'day', label: '일별', unit: 'day' as ColumnUnit, count: 30 },
] as const;
type ViewModeId = (typeof VIEW_MODES)[number]['id'];
const DEFAULT_VIEW_MODE: ViewModeId = 'month';

interface TimelineColumn {
  date: Date; // 컬럼의 시작 날짜
  label: string;
  isPeriodStart: boolean; // 더 큰 단위 경계 (월→년 시작 / 주·일→월 시작)
}

function buildTimelineColumns(start: Date, end: Date, unit: ColumnUnit): TimelineColumn[] {
  const cols: TimelineColumn[] = [];
  const cur = new Date(start);
  if (unit === 'month') {
    cur.setDate(1);
    let lastYear = -1;
    while (cur <= end) {
      const y = cur.getFullYear();
      const m = cur.getMonth() + 1;
      const isYearStart = lastYear !== y;
      cols.push({
        date: new Date(cur),
        label: isYearStart ? `${y}년 ${m}월` : `${m}월`,
        isPeriodStart: isYearStart,
      });
      lastYear = y;
      cur.setMonth(cur.getMonth() + 1);
    }
  } else if (unit === 'week') {
    // 월요일 정렬
    const day = cur.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    cur.setDate(cur.getDate() + mondayOffset);
    let lastMonth = -1;
    while (cur <= end) {
      const m = cur.getMonth() + 1;
      const d = cur.getDate();
      const isMonthStart = lastMonth !== m;
      cols.push({
        date: new Date(cur),
        label: isMonthStart ? `${m}/${d}` : `${d}`,
        isPeriodStart: isMonthStart,
      });
      lastMonth = m;
      cur.setDate(cur.getDate() + 7);
    }
  } else {
    // day
    let lastMonth = -1;
    while (cur <= end) {
      const m = cur.getMonth() + 1;
      const d = cur.getDate();
      const isMonthStart = lastMonth !== m;
      cols.push({
        date: new Date(cur),
        label: isMonthStart ? `${m}/${d}` : `${d}`,
        isPeriodStart: isMonthStart,
      });
      lastMonth = m;
      cur.setDate(cur.getDate() + 1);
    }
  }
  return cols;
}

function GanttTimeline({
  plans,
  onPlanClick,
}: {
  plans: ExtendedLongTermPlan[];
  onPlanClick: (plan: ExtendedLongTermPlan) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [viewMode, setViewMode] = useState<ViewModeId>(DEFAULT_VIEW_MODE);
  const mode = VIEW_MODES.find((v) => v.id === viewMode) ?? VIEW_MODES[1];
  const visibleColumns = mode.count;
  const columnUnit = mode.unit;
  const pendingCenterMsRef = useRef<number | null>(null);
  const { showSchoolEvents, showSchoolTimetable, toggleEvents, toggleTimetable } =
    useSchoolDisplayPrefs();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 컨테이너 너비 측정 (ResizeObserver)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    setContainerWidth(el.clientWidth);
    const ro = new ResizeObserver((entries) => {
      if (entries[0]) setContainerWidth(entries[0].contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleViewChange = (next: ViewModeId) => {
    if (next === viewMode) return;
    const el = scrollRef.current;
    if (el && containerWidth > 0) {
      // 변경 직전 뷰포트 중심의 timestamp 기억 → 새 뷰에서도 같은 시점에 위치
      const totalW = el.scrollWidth;
      const centerScroll = el.scrollLeft + containerWidth / 2;
      const centerPct = totalW > 0 ? centerScroll / totalW : 0.5;
      pendingCenterMsRef.current = centerPct;
    }
    setViewMode(next);
  };

  const datePlans = plans.filter((p) => p.startDate && p.endDate);
  const noDateCount = plans.length - datePlans.length;

  // 고정 범위: 작년 1월 ~ 내년 12월 (항상 3년), 계획이 범위 밖이면 확장
  const curYear = today.getFullYear();

  // 학교 행사 (3년치)
  const { data: linkedSchool } = useGetLinkedSchool();
  const { data: prevYearEvents } = useGetSchoolEvents(curYear - 1);
  const { data: curYearEvents } = useGetSchoolEvents(curYear);
  const { data: nextYearEvents } = useGetSchoolEvents(curYear + 1);

  // 오늘 시간표 (평일만)
  const isWeekday = today.getDay() >= 1 && today.getDay() <= 5;
  const todayDateStr = today.toISOString().split('T')[0];
  const { data: todayTimetable } = useGetDayTimetable(isWeekday ? todayDateStr : '');
  const todayEvents = useMemo<SchoolEvent[]>(() => {
    return (curYearEvents ?? []).filter((e) => e.date === todayDateStr);
  }, [curYearEvents, todayDateStr]);
  const isTodayHoliday = todayEvents.some((e) => e.isHoliday);
  const allSchoolEvents = useMemo<SchoolEvent[]>(() => {
    return [...(prevYearEvents ?? []), ...(curYearEvents ?? []), ...(nextYearEvents ?? [])];
  }, [prevYearEvents, curYearEvents, nextYearEvents]);
  let rangeStartDate = new Date(curYear - 1, 0, 1);
  let rangeEndDate = new Date(curYear + 1, 11, 31, 23, 59, 59, 999);
  if (datePlans.length > 0) {
    const minTs = Math.min(...datePlans.map((p) => new Date(p.startDate!).getTime()));
    const maxTs = Math.max(...datePlans.map((p) => new Date(p.endDate!).getTime()));
    const planMin = new Date(minTs);
    const planMax = new Date(maxTs);
    if (planMin < rangeStartDate)
      rangeStartDate = new Date(planMin.getFullYear(), planMin.getMonth(), 1);
    if (planMax > rangeEndDate)
      rangeEndDate = new Date(planMax.getFullYear(), planMax.getMonth() + 1, 0, 23, 59, 59, 999);
  }
  const rangeStart = rangeStartDate;
  const rangeEnd = rangeEndDate;
  const totalMs = rangeEnd.getTime() - rangeStart.getTime();

  // 뷰 모드별 컬럼 리스트 (단위에 따라 월/주/일)
  const columns = useMemo(
    () => buildTimelineColumns(rangeStart, rangeEnd, columnUnit),
    // rangeStart/End는 매 렌더 새 객체라 ms로 비교
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rangeStart.getTime(), rangeEnd.getTime(), columnUnit],
  );
  const numColumns = columns.length;
  const columnPx =
    containerWidth > 0 ? Math.max(COL_MIN_PX, containerWidth / visibleColumns) : COL_MIN_PX;
  // 미세 격자선 표시 여부 (날짜 단위에서는 너무 많아 생략, 월 경계만 표시)
  const showMinorLines = numColumns <= 60;

  // 마운트·컨테이너 크기 확정 시 → 오늘 위치로 스크롤
  useEffect(() => {
    if (!scrollRef.current || containerWidth <= 0) return;
    const totalW = numColumns * columnPx;
    if (pendingCenterMsRef.current !== null) {
      // 뷰 모드 전환 후: 직전 중심 비율을 새 totalW에 매핑
      scrollRef.current.scrollLeft = Math.max(
        0,
        pendingCenterMsRef.current * totalW - containerWidth / 2,
      );
      pendingCenterMsRef.current = null;
      return;
    }
    // 최초 마운트·리사이즈·계획 변동: 오늘로 스크롤
    const todayPct = (today.getTime() - rangeStart.getTime()) / totalMs;
    scrollRef.current.scrollLeft = Math.max(0, todayPct * totalW - containerWidth / 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerWidth, datePlans.length, columnUnit, numColumns, columnPx]);

  // 방학 구간 계산 (연도+이름으로 그룹화, 항상 호출해야 hooks 순서 일정)
  const vacationRanges = useMemo(() => {
    const byKey = new Map<string, { dates: Date[]; name: string }>();
    allSchoolEvents
      .filter((e) => e.isHoliday)
      .forEach((e) => {
        const d = new Date(e.date);
        const key = `${d.getFullYear()}-${e.eventName}`;
        const entry = byKey.get(key) ?? { dates: [], name: e.eventName };
        entry.dates.push(d);
        byKey.set(key, entry);
      });
    return Array.from(byKey.values()).map(({ name, dates }) => {
      dates.sort((a, b) => a.getTime() - b.getTime());
      return { name, start: dates[0], end: dates[dates.length - 1] };
    });
  }, [allSchoolEvents]);

  const nonHolidayEvents = useMemo(
    () => allSchoolEvents.filter((e) => !e.isHoliday),
    [allSchoolEvents],
  );

  const showSchoolRow = !!linkedSchool && allSchoolEvents.length > 0 && showSchoolEvents;
  const SCHOOL_ROW_H = 32;
  const isEmpty = datePlans.length === 0;

  // 오늘 위치 (%)
  const todayPct = ((today.getTime() - rangeStart.getTime()) / totalMs) * 100;
  const showToday = todayPct >= 0 && todayPct <= 100;

  // 과목별 그룹
  const subjectMap: Record<string, ExtendedLongTermPlan[]> = {};
  datePlans.forEach((p) => {
    const key = p.subject || '기타';
    if (!subjectMap[key]) subjectMap[key] = [];
    subjectMap[key].push(p);
  });
  const subjectEntries = Object.entries(subjectMap);

  // 날짜 → % (전체 범위 기준)
  const datePct = (d: Date) => ((d.getTime() - rangeStart.getTime()) / totalMs) * 100;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      {/* 타이틀 바 (모바일: 두 줄로 자동 wrap) */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-gray-50 px-4 py-3">
        <BarChart3 className="h-4 w-4 shrink-0 text-indigo-500" />
        <span className="shrink-0 text-sm font-bold text-gray-700">타임라인</span>
        {showToday && (
          <span className="flex shrink-0 items-center gap-1 text-[10px] text-red-400">
            <span className="inline-block h-2 w-px bg-red-400" />
            오늘
          </span>
        )}
        {/* 뷰 모드 탭 */}
        <div
          className="ml-0 inline-flex shrink-0 items-center gap-0.5 rounded-full border border-gray-200 bg-white p-0.5 sm:ml-3"
          role="tablist"
          aria-label="타임라인 뷰 모드"
        >
          {VIEW_MODES.map((v) => {
            const isActive = v.id === viewMode;
            return (
              <button
                key={v.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleViewChange(v.id)}
                className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors ${
                  isActive ? 'bg-indigo-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {v.label}
              </button>
            );
          })}
        </div>
        <div className="ml-auto shrink-0">
          {linkedSchool ? (
            <span className="flex items-center gap-1 whitespace-nowrap text-xs text-gray-400">
              🏫 {linkedSchool.schulName}
            </span>
          ) : (
            <a
              href={`${env.hubFrontUrl}/users/profile`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 whitespace-nowrap rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-600 hover:bg-sky-100"
            >
              🏫 학교 연결하기
            </a>
          )}
        </div>
      </div>

      {/* 본문: 좌측 고정 라벨 + 우측 스크롤 타임라인 */}
      <div className="flex">
        {/* ── 좌측: 과목 라벨 (스크롤 외부, 항상 보임) ── */}
        <div
          className="z-10 shrink-0 bg-white"
          style={{ width: `${LABEL_W}px`, boxShadow: '2px 0 4px rgba(0,0,0,0.04)' }}
        >
          {/* 헤더 행 높이 맞춤 */}
          <div className="border-b border-gray-100" style={{ height: '28px' }} />
          {/* 학교 일정 라벨 */}
          {showSchoolRow && (
            <div
              className="flex items-center border-b border-gray-100 px-3 text-[10px] font-bold text-amber-500"
              style={{ height: `${SCHOOL_ROW_H}px` }}
            >
              학교일정
            </div>
          )}
          {/* 과목 라벨 목록 */}
          {subjectEntries.map(([subject, subjectPlans]) => {
            const color = getSubjectColor(subject);
            const rowH = Math.max(36, subjectPlans.length * 28 + 8);
            return (
              <div
                key={subject}
                className="flex items-center border-b border-gray-50 px-3 text-[11px] font-bold last:border-0"
                style={{ height: `${rowH}px`, color }}
              >
                {subject}
              </div>
            );
          })}
          {/* 빈 상태 라벨 (좌측 영역) */}
          {isEmpty && (
            <div
              className="flex items-center border-b border-gray-50 px-3 text-[11px] font-medium text-gray-300"
              style={{ height: '72px' }}
            >
              계획 없음
            </div>
          )}
        </div>

        {/* ── 우측: 가로 스크롤 타임라인 ── */}
        <div ref={scrollRef} className="flex-1 overflow-x-auto">
          <div style={{ minWidth: '100%', width: `${numColumns * columnPx}px` }}>
            {/* 헤더 행 */}
            <div className="flex border-b border-gray-100" style={{ height: '28px' }}>
              {columns.map((c, i) => (
                <div
                  key={i}
                  className={`flex items-center px-1 ${
                    c.isPeriodStart
                      ? 'border-l-2 border-indigo-200 bg-indigo-50/40'
                      : 'border-l border-gray-100'
                  }`}
                  style={{
                    width: `${columnPx}px`,
                    minWidth: `${columnPx}px`,
                    height: '28px',
                  }}
                >
                  <span
                    className={`whitespace-nowrap text-[10px] font-semibold ${
                      c.isPeriodStart ? 'text-indigo-500' : 'text-gray-400'
                    }`}
                  >
                    {c.label}
                  </span>
                </div>
              ))}
            </div>

            {/* 학교 일정 행 */}
            {showSchoolRow && (
              <div
                className="relative border-b border-gray-100"
                style={{ height: `${SCHOOL_ROW_H}px` }}
              >
                {/* 컬럼 구분선 (월 경계는 강조, 미세는 컬럼 수가 적을 때만) */}
                {columns.map((c, i) =>
                  c.isPeriodStart || showMinorLines ? (
                    <div
                      key={i}
                      className={`absolute inset-y-0 w-px ${
                        c.isPeriodStart ? 'bg-indigo-100' : 'bg-gray-100'
                      }`}
                      style={{ left: `${(i / numColumns) * 100}%` }}
                    />
                  ) : null,
                )}
                {/* 오늘 마커 */}
                {showToday && (
                  <div
                    className="pointer-events-none absolute inset-y-0 z-10 w-px bg-red-400/70"
                    style={{ left: `${todayPct}%` }}
                  />
                )}
                {/* 방학 구간 오버레이 */}
                {vacationRanges.map((range, i) => {
                  const s = range.start.getTime() < rangeStart.getTime() ? rangeStart : range.start;
                  const e = range.end.getTime() > rangeEnd.getTime() ? rangeEnd : range.end;
                  if (s > e) return null;
                  const left = datePct(s);
                  const width = Math.max(0.3, datePct(e) - left);
                  return (
                    <div
                      key={i}
                      className="absolute inset-y-0 flex items-center overflow-hidden bg-amber-100/80 px-1"
                      style={{ left: `${left}%`, width: `${width}%` }}
                      title={range.name}
                    >
                      <span className="truncate text-[8px] font-bold text-amber-600">
                        {range.name}
                      </span>
                    </div>
                  );
                })}
                {/* 비방학 학교 행사 — 이름 블록 */}
                {nonHolidayEvents.map((ev, i) => {
                  const d = new Date(ev.date);
                  if (d < rangeStart || d > rangeEnd) return null;
                  const left = datePct(d);
                  return (
                    <div
                      key={i}
                      className="absolute top-1/2 z-10 -translate-y-1/2"
                      style={{ left: `${left}%` }}
                      title={ev.eventName}
                    >
                      <div className="max-w-[72px] overflow-hidden text-ellipsis whitespace-nowrap rounded bg-indigo-500 px-1 py-0.5 text-[8px] font-bold text-white shadow-sm">
                        {ev.eventName}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 과목별 타임라인 행 */}
            {subjectEntries.map(([subject, subjectPlans]) => {
              const color = getSubjectColor(subject);
              const rowH = Math.max(36, subjectPlans.length * 28 + 8);
              return (
                <div
                  key={subject}
                  className="relative border-b border-gray-50 last:border-0"
                  style={{ height: `${rowH}px` }}
                >
                  {/* 컬럼 구분선 */}
                  {columns.map((c, i) =>
                    c.isPeriodStart || showMinorLines ? (
                      <div
                        key={i}
                        className={`absolute inset-y-0 w-px ${
                          c.isPeriodStart ? 'bg-indigo-100' : 'bg-gray-100'
                        }`}
                        style={{ left: `${(i / numColumns) * 100}%` }}
                      />
                    ) : null,
                  )}

                  {/* 오늘 마커 */}
                  {showToday && (
                    <div
                      className="pointer-events-none absolute inset-y-0 z-10 w-px bg-red-400/70"
                      style={{ left: `${todayPct}%` }}
                    >
                      <div className="absolute -top-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-red-400" />
                    </div>
                  )}

                  {/* 계획 막대들 */}
                  {subjectPlans.map((plan, idx) => {
                    const ps = new Date(plan.startDate!);
                    const pe = new Date(plan.endDate!);
                    const barLeft = datePct(ps);
                    const barW = Math.max(0.5, datePct(pe) - barLeft);
                    const progress =
                      plan.totalAmount > 0
                        ? Math.min(100, Math.round((plan.completedAmount / plan.totalAmount) * 100))
                        : 0;
                    const isCompleted = progress >= 100;
                    const barTop = 4 + idx * 28;

                    return (
                      <div
                        key={plan.id}
                        className="group/bar absolute cursor-pointer"
                        style={{
                          left: `${barLeft}%`,
                          width: `${barW}%`,
                          top: `${barTop}px`,
                          height: '24px',
                          zIndex: 20,
                        }}
                        title={`${plan.title} · ${plan.subject} · ${progress}%  클릭하여 수정`}
                        onClick={() => onPlanClick(plan)}
                      >
                        <div
                          className="absolute inset-0 rounded-full opacity-20 transition-opacity group-hover/bar:opacity-35"
                          style={{ backgroundColor: color }}
                        />
                        <div
                          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: color,
                            opacity: isCompleted ? 1 : 0.75,
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-end overflow-hidden rounded-full pr-1.5 opacity-0 transition-opacity group-hover/bar:opacity-100">
                          <Pencil className="h-2.5 w-2.5 text-white drop-shadow" />
                        </div>
                        {barW > 6 && (
                          <div className="absolute inset-0 flex items-center overflow-hidden px-2">
                            <span className="truncate text-[9px] font-bold leading-none text-white drop-shadow">
                              {plan.title}
                            </span>
                            <span className="ml-auto shrink-0 text-[9px] font-bold text-white/90 drop-shadow">
                              {progress}%
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
            {/* 빈 상태 본문 행: 격자선 + 오늘선 + 안내 텍스트 */}
            {isEmpty && (
              <div
                className="relative border-b border-gray-50 last:border-0"
                style={{ height: '72px' }}
              >
                {/* 컬럼 구분선 */}
                {columns.map((c, i) =>
                  c.isPeriodStart || showMinorLines ? (
                    <div
                      key={i}
                      className={`absolute inset-y-0 w-px ${
                        c.isPeriodStart ? 'bg-indigo-100' : 'bg-gray-100'
                      }`}
                      style={{ left: `${(i / numColumns) * 100}%` }}
                    />
                  ) : null,
                )}
                {/* 오늘 마커 */}
                {showToday && (
                  <div
                    className="pointer-events-none absolute inset-y-0 z-10 w-px bg-red-400/70"
                    style={{ left: `${todayPct}%` }}
                  >
                    <div className="absolute -top-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-red-400" />
                  </div>
                )}
                {/* 빈 상태 안내 */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="rounded-full bg-gray-50 px-3 py-1 text-[11px] font-medium text-gray-400">
                    시작일·종료일이 있는 계획이 여기에 표시됩니다
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 오늘 시간표 (평일이고 학교 연결 & 방학 아닐 때) */}
      {linkedSchool && showSchoolTimetable && isWeekday && !isTodayHoliday && (
        <div className="border-t border-gray-50 px-4 py-2">
          <div className="mb-1.5 flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-sky-600">📚 오늘 시간표</span>
            <span className="text-[10px] text-gray-400">
              {today.getMonth() + 1}/{today.getDate()}
            </span>
          </div>
          {todayTimetable && todayTimetable.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {(todayTimetable as TimetableItem[])
                .slice()
                .sort((a, b) => Number(a.period) - Number(b.period))
                .map((tt) => {
                  const times = PERIOD_TIMES[tt.period];
                  return (
                    <div
                      key={tt.period}
                      className="flex items-center gap-1 rounded-lg border border-sky-100 bg-sky-50 px-2 py-1"
                      title={times ? `${times.start}~${times.end}` : ''}
                    >
                      <span className="text-[10px] font-bold text-sky-600">{tt.period}교시</span>
                      <span className="text-[10px] text-gray-600">{tt.subject}</span>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-[10px] text-gray-400">시간표 정보 없음</p>
          )}
        </div>
      )}

      {/* 오늘 학교 행사 */}
      {linkedSchool && showSchoolEvents && todayEvents.length > 0 && (
        <div className="border-t border-gray-50 px-4 py-2">
          <div className="mb-1.5 flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-indigo-600">🏫 오늘 학교 일정</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {todayEvents.map((ev) => (
              <div
                key={ev.id}
                className={`flex items-center gap-1 rounded-lg border px-2 py-1 ${ev.isHoliday ? 'border-amber-100 bg-amber-50' : 'border-indigo-100 bg-indigo-50'}`}
              >
                <span className="text-[10px]">{ev.isHoliday ? '🎉' : '📅'}</span>
                <span
                  className={`text-[10px] font-medium ${ev.isHoliday ? 'text-amber-700' : 'text-indigo-700'}`}
                >
                  {ev.eventName}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {linkedSchool && (
        <div className="flex flex-wrap items-center gap-4 border-t border-gray-50 px-4 py-2 text-xs text-gray-500">
          <span className="font-semibold text-gray-600">표시 옵션</span>
          <label className="flex cursor-pointer select-none items-center gap-1.5">
            <input
              type="checkbox"
              checked={showSchoolEvents}
              onChange={toggleEvents}
              className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-500 focus:ring-indigo-300"
            />
            <span>🏫 학교 일정</span>
          </label>
          <label className="flex cursor-pointer select-none items-center gap-1.5">
            <input
              type="checkbox"
              checked={showSchoolTimetable}
              onChange={toggleTimetable}
              className="h-3.5 w-3.5 rounded border-gray-300 text-sky-500 focus:ring-sky-300"
            />
            <span>📚 시간표</span>
          </label>
        </div>
      )}
      {noDateCount > 0 && (
        <div className="border-t border-gray-50 px-4 py-2">
          <p className="text-[10px] text-gray-400">
            기간 미설정 계획 {noDateCount}개는 타임라인에 표시되지 않습니다
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================
// 메인 페이지 컴포넌트
// ============================================

function PlannerPlansPage() {
  const { data: plans, isLoading, isError, error } = useGetPlans();
  const { data: routines } = useGetRoutines();
  const createPlanMutation = useCreatePlan();
  const updatePlanMutation = useUpdatePlan();
  const distributeMutation = useDistributePlan();
  const deleteMutation = useDeletePlan();

  // 다이얼로그 상태
  const [isPlanSetupOpen, setIsPlanSetupOpen] = useState(false);
  const { guard, LoginGuardModal } = useLoginGuard();

  // 수정 다이얼로그 상태
  const [editTarget, setEditTarget] = useState<ExtendedLongTermPlan | null>(null);

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
      await createPlanMutation.mutateAsync({
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
      toast.error('먼저 주간루틴에서 공부 시간표를 만들어주세요.', {
        action: { label: '주간루틴으로', onClick: () => (window.location.href = '/routine') },
      });
      return;
    }

    try {
      const result = await distributeMutation.mutateAsync({
        plan,
        routines,
        startDate: new Date(plan.startDate || new Date()),
        endDate: new Date(plan.endDate || new Date()),
      });
      // 분배된 미션 수 확인 — 매칭되는 루틴이 없으면 0개가 만들어짐
      const createdCount =
        result && typeof result === 'object' && !Array.isArray(result) && 'created' in result
          ? Number((result as { created: number }).created)
          : Array.isArray(result)
            ? result.length
            : 0;
      if (!createdCount) {
        toast.error(
          `'${plan.subject || '이 과목'}'에 해당하는 자습 루틴이 없어 미션을 배분하지 못했어요. 주간루틴에서 같은 과목의 자습 시간을 추가해주세요.`,
          { action: { label: '주간루틴으로', onClick: () => (window.location.href = '/routine') } },
        );
        return;
      }
      toast.success(
        `${createdCount}개 미션으로 배분했어요! 이제 금일계획에 매일 자동으로 표시됩니다.`,
        { action: { label: '금일계획 보기', onClick: () => (window.location.href = '/missions') } },
      );
    } catch {
      toast.error('일정 분배에 실패했습니다.');
    }
  };

  const handleEdit = async (plan: ExtendedLongTermPlan, data: Partial<ExtendedLongTermPlan>) => {
    try {
      await updatePlanMutation.mutateAsync({
        id: plan.id,
        title: data.title ?? plan.title,
        subject: data.subject ?? plan.subject,
        startDate: data.startDate ?? plan.startDate,
        endDate: data.endDate ?? plan.endDate,
        totalAmount: data.totalAmount ?? plan.totalAmount,
        completedAmount: plan.completedAmount,
        type: plan.type,
      } as any);
      setEditTarget(null);
      toast.success('계획이 수정되었습니다.');
    } catch {
      toast.error('계획 수정에 실패했습니다.');
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

  // 과목별 그룹핑
  const plansBySubject = useMemo(() => {
    if (!plans) return [];
    const groups: Record<string, ExtendedLongTermPlan[]> = {};
    plans.forEach((plan) => {
      const key = plan.subject || '기타';
      if (!groups[key]) groups[key] = [];
      groups[key].push(plan as ExtendedLongTermPlan);
    });
    return Object.entries(groups).map(([label, groupPlans]) => ({ label, plans: groupPlans }));
  }, [plans]);

  // 과목별 성취율
  const subjectAchievement = useMemo(() => {
    if (!plans) return [];
    const bySubject: Record<string, { completed: number; total: number }> = {};
    plans.forEach((p) => {
      const s = p.subject || '기타';
      if (!bySubject[s]) bySubject[s] = { completed: 0, total: 0 };
      bySubject[s].completed += p.completedAmount || 0;
      bySubject[s].total += p.totalAmount || 0;
    });
    return Object.entries(bySubject).map(([subject, { completed, total }]) => ({
      subject,
      pct: total > 0 ? Math.round((completed / total) * 100) : 0,
      color: getSubjectColor(subject),
    }));
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

  if (isError) {
    const errMsg =
      (error as any)?.response?.data?.message || (error as any)?.message || String(error);
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 p-8 text-center">
        <p className="text-lg font-bold text-red-500">계획 불러오기 실패</p>
        <p className="max-w-sm rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{errMsg}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ═══════ 히어로 헤더 ═══════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-800 px-4 pb-20 pt-6 text-white md:pb-24 md:pt-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-indigo-400/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link to="/" className="rounded-full p-1.5 transition-colors hover:bg-white/10">
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-lg font-bold tracking-tight md:text-xl">장기 계획</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                <Sparkles className="h-3 w-3 text-yellow-300" />
                목표 관리
              </div>
            </div>
          </div>

          <div className="mb-4 text-center">
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">나의 장기 계획</h2>
            <p className="mt-1 text-sm text-blue-200">계획을 세우고 일정을 관리하세요</p>
          </div>

          {/* 통계 3카드 */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 p-3 text-center shadow-lg">
              <div className="text-lg font-extrabold text-white">{stats.total}</div>
              <div className="text-[10px] font-medium text-white/80">전체 계획</div>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 p-3 text-center shadow-lg">
              <div className="text-lg font-extrabold text-white">
                {stats.inProgress + stats.completed}
              </div>
              <div className="text-[10px] font-medium text-white/80">진행/완료</div>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 p-3 text-center shadow-lg">
              <div className="text-lg font-extrabold text-white">{stats.avgProgress}%</div>
              <div className="text-[10px] font-medium text-white/80">평균 진행률</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ 타임라인 (full-width) ═══════ */}
      <div className="relative -mt-10 px-3 pb-4 sm:px-5">
        <GanttTimeline
          plans={plans ?? []}
          onPlanClick={(plan) => guard(() => setEditTarget(plan as ExtendedLongTermPlan))}
        />
      </div>

      {/* ═══════ 과목별 계획 목록 ═══════ */}
      <div className="mx-auto max-w-2xl px-4 pb-24">
        {/* ── 과목별 성취율 그래프 ── */}
        {plans && plans.length > 0 && (
          <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-gray-700">
                <BarChart3 className="h-4 w-4 text-indigo-500" />
                과목별 성취율
              </h3>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-600">
                  전체 {stats.total}
                </span>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-600">
                  진행 {stats.inProgress}
                </span>
                <span className="rounded-full bg-green-50 px-2 py-0.5 font-medium text-green-600">
                  완료 {stats.completed}
                </span>
              </div>
            </div>
            <div className="space-y-2.5">
              {subjectAchievement.map(({ subject, pct, color }) => (
                <div key={subject}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-medium text-gray-700">{subject}</span>
                    </div>
                    <span className="font-bold" style={{ color }}>
                      {pct}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 과목별 계획 목록 헤더 ── */}
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-700">계획 목록</h3>
        </div>

        {/* ── 과목별 그룹 ── */}
        {plans && plans.length > 0 ? (
          <div className="space-y-5">
            {plansBySubject.map(({ label, plans: groupPlans }) => {
              const groupCompleted = groupPlans.reduce((s, p) => s + (p.completedAmount || 0), 0);
              const groupTotal = groupPlans.reduce((s, p) => s + (p.totalAmount || 0), 0);
              const groupPct = groupTotal > 0 ? Math.round((groupCompleted / groupTotal) * 100) : 0;

              return (
                <div key={label}>
                  {/* 그룹 헤더 */}
                  <div className="mb-2.5 flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-600">{label}</span>
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-indigo-400 transition-all duration-500"
                        style={{ width: `${groupPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-indigo-600">{groupPct}%</span>
                  </div>

                  {/* 플랜 카드들 */}
                  <div className="space-y-2.5">
                    {groupPlans.map((plan) => {
                      const color = getSubjectColor(plan.subject || '기타');
                      const progress =
                        plan.totalAmount && plan.totalAmount > 0
                          ? Math.round((plan.completedAmount / plan.totalAmount) * 100)
                          : 0;
                      const isCompleted = progress >= 100;
                      const startDate = plan.startDate
                        ? new Date(plan.startDate).toLocaleDateString('ko-KR')
                        : '-';
                      const endDate = plan.endDate
                        ? new Date(plan.endDate).toLocaleDateString('ko-KR')
                        : '-';

                      return (
                        <div
                          key={plan.id}
                          className="group rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                          style={{
                            borderLeftWidth: '4px',
                            borderLeftColor: isCompleted ? '#22c55e' : color,
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                                plan.type === 'lecture' ? 'bg-purple-50' : 'bg-blue-50'
                              }`}
                            >
                              {plan.type === 'lecture' ? (
                                <MonitorPlay className="h-5 w-5 text-purple-500" />
                              ) : (
                                <BookOpen className="h-5 w-5 text-blue-500" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white"
                                  style={{ backgroundColor: color }}
                                >
                                  {plan.subject || '미지정'}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {plan.type === 'lecture' ? '강의' : '교재'}
                                </span>
                                {plan.isDistributed && (
                                  <span className="rounded bg-green-100 px-1.5 py-0.5 text-[9px] font-medium text-green-600">
                                    완료
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 truncate text-sm font-medium text-gray-800">
                                {plan.title}
                              </p>
                              <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                                <span>
                                  {startDate} ~ {endDate}
                                </span>
                                {plan.weeklyTarget && (
                                  <>
                                    <span>·</span>
                                    <span>
                                      주 {plan.weeklyTarget}
                                      {plan.type === 'lecture' ? '강' : 'p'}
                                    </span>
                                  </>
                                )}
                              </div>
                              <div className="mt-2">
                                <div className="mb-1 flex items-center justify-between text-[10px]">
                                  <span className="text-gray-400">
                                    {plan.completedAmount ?? 0} / {plan.totalAmount ?? 0}
                                  </span>
                                  <span className="font-bold" style={{ color }}>
                                    {progress}%
                                  </span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                                  <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{ width: `${progress}%`, backgroundColor: color }}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-shrink-0 flex-col items-center gap-1">
                              <button
                                onClick={() => {
                                  setCommentTarget(plan);
                                  setCommentOpen(true);
                                }}
                                className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-indigo-50 hover:text-indigo-500"
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => guard(() => setEditTarget(plan))}
                                className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-amber-50 hover:text-amber-500"
                                title="수정"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              {!plan.isDistributed && (
                                <button
                                  onClick={() => guard(() => handleDistribute(plan))}
                                  className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[10px] font-bold text-white shadow-sm transition-colors hover:bg-indigo-700"
                                  title="주간루틴으로 배분"
                                >
                                  주간 배분
                                </button>
                              )}
                              <button
                                onClick={() => guard(() => handleDelete(plan.id))}
                                className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            mood="point"
            title="1단계 · 장기계획 만들기"
            description="끝낼 교재와 기간을 정해두면, 주간루틴을 거쳐 매일의 미션이 자동으로 채워집니다"
            actionLabel="계획 추가하기"
            onAction={() => guard(() => setIsPlanSetupOpen(true))}
          />
        )}
      </div>

      {/* FAB (모바일에서 하단 탭바·카드 액션과 겹치지 않게 우하단 코너로) */}
      <button
        aria-label="새 계획 추가"
        onClick={() => guard(() => setIsPlanSetupOpen(true))}
        className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-200 transition-all hover:scale-105 hover:shadow-xl active:scale-95 md:bottom-6 md:right-[calc(50%-28rem)]"
      >
        <Plus className="h-7 w-7" />
      </button>

      {/* 장기 계획 설정 다이얼로그 */}
      <PlanSetupDialog
        open={isPlanSetupOpen}
        onOpenChange={setIsPlanSetupOpen}
        onSubmit={handleCreatePlan}
        isLoading={createPlanMutation.isPending}
      />

      {LoginGuardModal}

      {/* 수정 다이얼로그 */}
      {editTarget && (
        <EditPlanDialog
          open={!!editTarget}
          onOpenChange={(open) => !open && setEditTarget(null)}
          plan={editTarget}
          onSubmit={(data) => handleEdit(editTarget, data)}
          isLoading={updatePlanMutation.isPending}
        />
      )}

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
