/**
 * 금일계획 페이지 — Google Calendar 스타일
 * - 타임라인 카드 뷰 (미션만 표시)
 * - 각 미션 카드에 계획+결과 통합 표시
 * - 결과 미입력 시 "결과 입력" 버튼, 입력 후 인라인 표시
 * - FAB (플로팅 +) 버튼으로 미션 생성
 * - 교과/과목 드롭다운 + 4탭 교재/범위 설정
 */

import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Target,
  Pencil,
  Plus,
  Trash2,
  Clock,
  BookOpen,
  FileText,
  MonitorPlay,
  CheckCircle2,
  ClipboardCheck,
} from 'lucide-react';
import {
  useGetDailyMissions,
  useCreateMission,
  useUpdateMission,
  useDeleteMission,
  useGetSubjects,
  useSearchMaterials,
  useGetRoutines,
} from '@/stores/server/planner';
import type { DailyMission } from '@/stores/server/planner/planner-types';
import { getSubjectColor } from '@/types/planner';
import type { Routine } from '@/types/planner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useUpsertReflection } from '@/stores/server/planner/hooks';

// 컨페티 애니메이션 (pure CSS/JS)
function triggerConfetti() {
  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;inset:0;z-index:9999;pointer-events:none;overflow:hidden;';
  document.body.appendChild(container);

  const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6b9d', '#c084fc', '#fb923c'];
  for (let i = 0; i < 30; i++) {
    const particle = document.createElement('div');
    const size = Math.random() * 10 + 6;
    const left = Math.random() * 100;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const delay = Math.random() * 0.5;
    const duration = Math.random() * 1.5 + 1.5;
    particle.style.cssText = `
      position:absolute;top:-20px;left:${left}%;width:${size}px;height:${size}px;
      background:${color};border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
      animation:confetti-fall ${duration}s ease-in ${delay}s forwards;
    `;
    container.appendChild(particle);
  }

  // CSS 애니메이션 주입
  if (!document.getElementById('confetti-style')) {
    const style = document.createElement('style');
    style.id = 'confetti-style';
    style.textContent = `
      @keyframes confetti-fall {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  setTimeout(() => container.remove(), 3500);
}

export const Route = createLazyFileRoute('/missions')({
  component: MyMissionsPage,
});

// ============================================
// 상수
// ============================================
const DAYS_KR = ['일', '월', '화', '수', '목', '금', '토'] as const;

// ============================================
// 도넛 차트 컴포넌트
// ============================================
function DonutChart({
  slices,
  title,
  totalLabel,
}: {
  slices: { label: string; value: number; color: string }[];
  title: string;
  totalLabel: string;
}) {
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs font-bold text-gray-600">{title}</p>
        <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-gray-100">
          <span className="text-[10px] text-gray-400">데이터 없음</span>
        </div>
      </div>
    );
  }
  let cumulative = 0;
  const gradientParts = slices.map((s) => {
    const start = (cumulative / total) * 360;
    cumulative += s.value;
    const end = (cumulative / total) * 360;
    return `${s.color} ${start}deg ${end}deg`;
  });
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs font-bold text-gray-600">{title}</p>
      <div
        className="relative h-24 w-24 rounded-full"
        style={{ background: `conic-gradient(${gradientParts.join(', ')})` }}
      >
        <div className="absolute inset-2 flex flex-col items-center justify-center rounded-full bg-white">
          <span className="text-[10px] text-gray-400">{totalLabel}</span>
          <span className="text-sm font-bold">{total}시간</span>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-0.5">
        {slices
          .filter((s) => s.value > 0)
          .map((s) => (
            <div key={s.label} className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-[10px] text-gray-500">
                {s.label} {s.value}h
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

// ============================================
// 교재 4탭 타입
// ============================================
type MaterialTab = 'textbook' | 'reference' | 'lecture' | 'other';

const MATERIAL_TABS: { key: MaterialTab; label: string; icon: React.ReactNode }[] = [
  { key: 'textbook', label: '교과서', icon: <BookOpen className="h-3.5 w-3.5" /> },
  { key: 'reference', label: '참고서', icon: <FileText className="h-3.5 w-3.5" /> },
  { key: 'lecture', label: '인강', icon: <MonitorPlay className="h-3.5 w-3.5" /> },
  { key: 'other', label: '기타', icon: <Target className="h-3.5 w-3.5" /> },
];

// ============================================
// 시간 헬퍼
// ============================================
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));
const parseHM = (time: string) => {
  const [h, m] = time.split(':');
  return { h: h || '09', m: m || '00' };
};
const SELECT_CLASS =
  'rounded-md border border-gray-200 bg-white px-1.5 py-1.5 text-sm focus:border-blue-400 focus:outline-none';

// ============================================
// 미션 생성/수정 다이얼로그
// ============================================
interface MissionFormData {
  title: string;
  startTime: string;
  endTime: string;
  kyokwa: string;
  subject: string;
  content: string;
  materialTab: MaterialTab;
  materialName: string;
  materialId?: number;
  startPage: string;
  endPage: string;
  otherName: string;
  amountUnit: 'page' | 'lecture';
}

const INITIAL_FORM: MissionFormData = {
  title: '',
  startTime: '09:00',
  endTime: '10:00',
  kyokwa: '',
  subject: '',
  content: '',
  materialTab: 'reference',
  materialName: '',
  materialId: undefined,
  startPage: '',
  endPage: '',
  otherName: '',
  amountUnit: 'page',
};

function MissionDialog({
  mission,
  open,
  onOpenChange,
  onSave,
  onDelete,
  isNew,
}: {
  mission: DailyMission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: MissionFormData, missionId?: number) => void;
  onDelete?: (missionId: number) => void;
  isNew?: boolean;
}) {
  const { data: subjectsData } = useGetSubjects();
  const groups = subjectsData?.groups || [];

  const [form, setForm] = useState<MissionFormData>(INITIAL_FORM);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

  const searchCategory =
    form.materialTab === 'textbook'
      ? 'textbook'
      : form.materialTab === 'reference'
        ? 'reference'
        : form.materialTab === 'lecture'
          ? 'lecture'
          : undefined;
  const { data: searchResults } = useSearchMaterials(debouncedQuery, searchCategory);

  useMemo(() => {
    if (mission && open) {
      setForm({
        title: mission.title || '',
        startTime: mission.startTime || '09:00',
        endTime: mission.endTime || '10:00',
        kyokwa: '',
        subject: mission.subject || '',
        content: mission.content || '',
        materialTab: 'reference',
        materialName: '',
        materialId: undefined,
        startPage: mission.startPage?.toString() || '',
        endPage: mission.endPage?.toString() || '',
        otherName: '',
        amountUnit: 'page',
      });
      setSearchQuery('');
      setSelectedMaterial(null);
    } else if (isNew && open) {
      setForm(INITIAL_FORM);
      setSearchQuery('');
      setSelectedMaterial(null);
    }
  }, [mission, open, isNew]);

  const update = (key: keyof MissionFormData, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleKyokwaChange = (kyokwa: string) => {
    setForm((prev) => ({ ...prev, kyokwa, subject: '' }));
  };

  const availableSubjects = useMemo(() => {
    if (!form.kyokwa) return [];
    const group = groups.find((g: any) => g.kyokwa === form.kyokwa);
    return group?.subjects || [];
  }, [form.kyokwa, groups]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowResults(true);
    setSelectedMaterial(null);
    setTimeout(() => setDebouncedQuery(value), 300);
  };

  const handleSelectMaterial = (material: any) => {
    setSelectedMaterial(material);
    setSearchQuery(material.name);
    update('materialName', material.name);
    update('materialId', material.id);
    setShowResults(false);
    if (material.totalPages) {
      update('startPage', '1');
      update('endPage', String(material.totalPages));
    }
  };

  const handleTabChange = (tab: MaterialTab) => {
    update('materialTab', tab);
    setSearchQuery('');
    setDebouncedQuery('');
    setSelectedMaterial(null);
    update('startPage', '');
    update('endPage', '');
    setShowResults(false);
  };

  const planTotal = (Number(form.endPage) || 0) - (Number(form.startPage) || 0);
  const unitLabel = form.materialTab === 'lecture' ? '강' : '페이지';
  const color = form.subject ? getSubjectColor(form.subject) : '#3b82f6';

  const handleSave = () => {
    onSave(form, mission?.id);
    onOpenChange(false);
  };

  const startHM = parseHM(form.startTime);
  const endHM = parseHM(form.endTime);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-[480px]">
        <div className="rounded-t-lg px-5 py-4" style={{ backgroundColor: color + '15' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              {isNew ? (
                <Plus className="h-5 w-5" style={{ color }} />
              ) : (
                <Pencil className="h-4 w-4" style={{ color }} />
              )}
              <span style={{ color }}>{isNew ? '새 미션 추가' : '미션 수정'}</span>
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-5 pb-5">
          {/* 미션 제목 */}
          <div>
            <Label className="text-sm font-semibold text-gray-700">미션 제목</Label>
            <Input
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="예: 수학 문제풀이, 영어 단어 암기 ..."
              className="mt-1 h-9"
              autoFocus
            />
          </div>

          {/* 시간 (시/분) */}
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-gray-400" />
            <div className="flex items-center gap-1">
              <select
                value={startHM.h}
                onChange={(e) => update('startTime', `${e.target.value}:${startHM.m}`)}
                className={SELECT_CLASS}
              >
                {HOUR_OPTIONS.map((h) => (
                  <option key={h} value={h}>
                    {h}시
                  </option>
                ))}
              </select>
              <select
                value={startHM.m}
                onChange={(e) => update('startTime', `${startHM.h}:${e.target.value}`)}
                className={SELECT_CLASS}
              >
                {MINUTE_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m}분
                  </option>
                ))}
              </select>
              <span className="mx-1 text-gray-400">~</span>
              <select
                value={endHM.h}
                onChange={(e) => update('endTime', `${e.target.value}:${endHM.m}`)}
                className={SELECT_CLASS}
              >
                {HOUR_OPTIONS.map((h) => (
                  <option key={h} value={h}>
                    {h}시
                  </option>
                ))}
              </select>
              <select
                value={endHM.m}
                onChange={(e) => update('endTime', `${endHM.h}:${e.target.value}`)}
                className={SELECT_CLASS}
              >
                {MINUTE_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m}분
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 교과/과목 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-500">교과</Label>
              <select
                value={form.kyokwa}
                onChange={(e) => handleKyokwaChange(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-200 bg-white px-2 py-2 text-sm focus:border-blue-400 focus:outline-none"
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
              <Label className="text-xs text-gray-500">과목</Label>
              <select
                value={form.subject}
                onChange={(e) => update('subject', e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-200 bg-white px-2 py-2 text-sm focus:border-blue-400 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
                disabled={!form.kyokwa}
              >
                <option value="">{form.kyokwa ? '과목 선택' : '교과 먼저 선택'}</option>
                {availableSubjects.map((s: any) => (
                  <option key={s.id || s.subjectName} value={s.subjectName}>
                    {s.subjectName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 내용 */}
          <div>
            <Label className="text-xs text-gray-500">내용</Label>
            <Input
              value={form.content}
              onChange={(e) => update('content', e.target.value)}
              placeholder="미션 세부 내용"
              className="mt-1 h-9"
            />
          </div>

          {/* 교재 4탭 */}
          <div className="rounded-lg border border-gray-200">
            <div className="flex border-b border-gray-200">
              {MATERIAL_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex flex-1 items-center justify-center gap-1 px-2 py-2.5 text-xs font-medium transition-colors ${form.materialTab === tab.key ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="p-3">
              {form.materialTab !== 'other' ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Label className="text-xs text-gray-500">
                      {form.materialTab === 'textbook'
                        ? '교과서'
                        : form.materialTab === 'reference'
                          ? '참고서'
                          : '인강'}{' '}
                      검색
                    </Label>
                    <Input
                      placeholder={`${form.materialTab === 'textbook' ? '교과서' : form.materialTab === 'reference' ? '참고서' : '인강'}명을 입력하세요`}
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      onFocus={() => searchQuery.length >= 1 && setShowResults(true)}
                      className="mt-1 h-8 text-sm"
                    />
                    {showResults && searchResults && searchResults.length > 0 && (
                      <div className="absolute z-50 mt-1 max-h-36 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                        {searchResults.map((m: any) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => handleSelectMaterial(m)}
                            className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-blue-50"
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
                      </div>
                    )}
                    {showResults &&
                      debouncedQuery.length >= 1 &&
                      searchResults &&
                      searchResults.length === 0 && (
                        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                          <button
                            type="button"
                            onClick={() => {
                              update('materialName', searchQuery);
                              update('materialId', undefined);
                              setSelectedMaterial({ name: searchQuery });
                              setShowResults(false);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-blue-50"
                          >
                            <span className="text-blue-500">+</span>
                            <span className="text-gray-700">
                              "<span className="font-medium">{searchQuery}</span>" 직접 입력
                            </span>
                          </button>
                        </div>
                      )}
                  </div>
                  {selectedMaterial && (
                    <div className="rounded-md border border-blue-200 bg-blue-50 p-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-blue-800">
                            {selectedMaterial.name}
                          </p>
                          <p className="text-[10px] text-blue-600">
                            {selectedMaterial.publisher && `${selectedMaterial.publisher} · `}
                            {selectedMaterial.totalPages && `총 ${selectedMaterial.totalPages}p`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMaterial(null);
                            setSearchQuery('');
                            update('materialName', '');
                            update('startPage', '');
                            update('endPage', '');
                          }}
                          className="text-[10px] text-blue-500 hover:text-blue-700"
                        >
                          변경
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-500">교재/강의명 (직접 입력)</Label>
                    <Input
                      placeholder="예: 수학의 정석 기본편"
                      value={form.otherName}
                      onChange={(e) => update('otherName', e.target.value)}
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-gray-500">단위</Label>
                    <div className="flex rounded-md border border-gray-200">
                      <button
                        type="button"
                        onClick={() => update('amountUnit', 'page')}
                        className={`px-2.5 py-1 text-xs transition-colors ${form.amountUnit === 'page' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'} rounded-l-md`}
                      >
                        페이지
                      </button>
                      <button
                        type="button"
                        onClick={() => update('amountUnit', 'lecture')}
                        className={`px-2.5 py-1 text-xs transition-colors ${form.amountUnit === 'lecture' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'} rounded-r-md border-l`}
                      >
                        강의
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div className="mt-3 border-t border-gray-100 pt-3">
                <Label className="text-xs text-gray-500">범위</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    placeholder="시작"
                    value={form.startPage}
                    onChange={(e) => update('startPage', e.target.value)}
                    className="h-8 flex-1 text-center text-sm"
                  />
                  <span className="text-gray-400">~</span>
                  <Input
                    type="number"
                    placeholder="끝"
                    value={form.endPage}
                    onChange={(e) => update('endPage', e.target.value)}
                    className="h-8 flex-1 text-center text-sm"
                  />
                  <div className="flex h-8 min-w-[60px] items-center justify-center rounded-md bg-blue-100 text-sm font-bold text-blue-700">
                    {planTotal > 0 ? `${planTotal}${unitLabel === '강' ? '강' : 'p'}` : '-'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 액션 */}
          <div className="flex items-center gap-2 pt-1">
            {!isNew && onDelete && mission && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(mission.id)}
                className="gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                삭제
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="gap-1"
              style={{ backgroundColor: color }}
            >
              {isNew ? <Plus className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
              {isNew ? '추가' : '저장'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 결과 입력 다이얼로그 (경량)
// ============================================
interface ResultFormData {
  startPage: string;
  endPage: string;
  progress: string;
  memo: string;
  understanding: number;
}

function ResultDialog({
  mission,
  open,
  onOpenChange,
  onSave,
}: {
  mission: DailyMission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (missionId: number, data: ResultFormData) => void;
}) {
  const [form, setForm] = useState<ResultFormData>({
    startPage: '',
    endPage: '',
    progress: '0',
    memo: '',
    understanding: 3,
  });

  useMemo(() => {
    if (mission && open) {
      setForm({
        startPage: mission.resultStartPage?.toString() || '',
        endPage: mission.resultEndPage?.toString() || '',
        progress: mission.progress?.toString() || '0',
        memo: mission.resultMemo || '',
        understanding: 3,
      });
    }
  }, [mission, open]);

  const update = (key: keyof ResultFormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resultTotal = (Number(form.endPage) || 0) - (Number(form.startPage) || 0);
  const progressNum = Number(form.progress) || 0;
  const color = mission?.subject ? getSubjectColor(mission.subject) : '#8b5cf6';

  const handleSave = () => {
    if (mission) {
      onSave(mission.id, form);
      onOpenChange(false);
    }
  };

  if (!mission) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 sm:max-w-[400px]">
        {/* 헤더 */}
        <div className="rounded-t-lg bg-purple-50 px-5 py-3">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-purple-700">
              <ClipboardCheck className="h-4.5 w-4.5" />
              결과 입력
            </DialogTitle>
          </DialogHeader>
          <p className="mt-1 text-xs text-purple-500">
            {mission.startTime}~{mission.endTime} · {mission.subject || '미지정'} ·{' '}
            {mission.content || mission.title || ''}
          </p>
        </div>

        <div className="space-y-4 px-5 pb-5 pt-3">
          {/* 실제 학습 분량 */}
          <div>
            <Label className="text-xs font-semibold text-gray-600">실제 학습 분량</Label>
            <div className="mt-1.5 flex items-center gap-2">
              <Input
                type="number"
                min={1}
                placeholder="시작"
                value={form.startPage}
                onChange={(e) => update('startPage', e.target.value)}
                className="h-8 flex-1 text-center text-sm"
              />
              <span className="text-gray-400">~</span>
              <Input
                type="number"
                placeholder="끝"
                value={form.endPage}
                onChange={(e) => update('endPage', e.target.value)}
                className="h-8 flex-1 text-center text-sm"
              />
              <div className="flex h-8 min-w-[50px] items-center justify-center rounded-md bg-purple-100 text-sm font-bold text-purple-700">
                {resultTotal > 0 ? `${resultTotal}p` : '-'}
              </div>
            </div>
          </div>

          {/* 완성도 */}
          <div>
            <Label className="text-xs font-semibold text-gray-600">완성도</Label>
            <div className="mt-1.5 flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={progressNum}
                onChange={(e) => update('progress', e.target.value)}
                className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-gray-200 accent-purple-600"
              />
              <span
                className={`min-w-[40px] text-right text-sm font-bold ${progressNum >= 100 ? 'text-green-600' : 'text-purple-600'}`}
              >
                {progressNum}%
              </span>
            </div>
            {/* 프리셋 버튼 */}
            <div className="mt-2 flex gap-1.5">
              {[0, 25, 50, 75, 100].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => update('progress', String(v))}
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-colors ${
                    progressNum === v
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {v}%
                </button>
              ))}
            </div>
          </div>

          {/* 메모 */}
          <div>
            <Label className="text-xs font-semibold text-gray-600">메모</Label>
            <Input
              value={form.memo}
              onChange={(e) => update('memo', e.target.value)}
              placeholder="오늘 학습 메모..."
              className="mt-1 h-8 text-sm"
            />
          </div>

          {/* 이해도 평가 */}
          <div>
            <Label className="text-xs font-semibold text-gray-600">오늘 이해도 자가 평가</Label>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, understanding: v }))}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm transition-all ${
                      v <= form.understanding
                        ? 'bg-amber-400 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <span className="text-xs text-gray-400">
                {['', '매우 낮음', '낮음', '보통', '높음', '매우 높음'][form.understanding]}
              </span>
            </div>
          </div>

          {/* 액션 */}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="gap-1 bg-purple-600 hover:bg-purple-700"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              저장
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 메인 페이지
// ============================================
function MyMissionsPage() {
  const { data: missions, isLoading } = useGetDailyMissions();
  const { data: routines } = useGetRoutines();
  const createMutation = useCreateMission();
  const updateMutation = useUpdateMission();
  const deleteMutation = useDeleteMission();

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [dailyGoal, setDailyGoal] = useState('');
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  // 다이얼로그 상태
  const [missionDialogOpen, setMissionDialogOpen] = useState(false);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DailyMission | null>(null);
  const [resultTarget, setResultTarget] = useState<DailyMission | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const dateStr = selectedDate.toISOString().split('T')[0];
  const isToday = dateStr === new Date().toISOString().split('T')[0];

  // 선택한 날짜의 요일에 활성화된 루틴 필터링
  const dayRoutines = useMemo(() => {
    if (!routines) return [];
    const dayIndex = selectedDate.getDay(); // 0=일 ~ 6=토
    return (routines as Routine[])
      .filter((r) => {
        if (!r.days || !r.days[dayIndex]) return false;
        if (!r.repeat) return false;
        return true;
      })
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  }, [routines, selectedDate]);

  const dayMissions = useMemo(() => {
    if (!missions) return [];
    return missions.filter((m: DailyMission) => {
      const mDate = typeof m.date === 'string' ? m.date.split('T')[0] : '';
      return mDate === dateStr;
    });
  }, [missions, dateStr]);

  // 루틴 + 미션 통합 타임라인 (시간순 정렬)
  type TimelineItem = { type: 'routine'; data: Routine } | { type: 'mission'; data: DailyMission };

  const timelineItems = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [
      ...dayRoutines.map((r) => ({ type: 'routine' as const, data: r })),
      ...dayMissions.map((m) => ({ type: 'mission' as const, data: m })),
    ];
    items.sort((a, b) => {
      const aTime = a.type === 'routine' ? a.data.startTime : a.data.startTime || '99:99';
      const bTime = b.type === 'routine' ? b.data.startTime : b.data.startTime || '99:99';
      return aTime.localeCompare(bTime);
    });
    return items;
  }, [dayRoutines, dayMissions]);

  // 날짜 이동
  const navigateDate = (dir: 'prev' | 'next') => {
    setSelectedDate((d) => {
      const n = new Date(d);
      n.setDate(n.getDate() + (dir === 'prev' ? -1 : 1));
      return n;
    });
  };
  const goToToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setSelectedDate(d);
  };

  // 통계
  const totalMissions = dayMissions.length;
  const completedMissions = dayMissions.filter(
    (m: DailyMission) => m.status === 'completed' || (m.progress && m.progress >= 100),
  ).length;
  const progressPercent =
    totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0;

  // 도넛 차트 데이터
  const subjectStats = useMemo(() => {
    const stats: Record<string, number> = {};
    dayMissions.forEach((m: DailyMission) => {
      const subj = m.subject || '기타';
      const startH = parseInt(m.startTime?.split(':')[0] || '0', 10);
      const endH = parseInt(m.endTime?.split(':')[0] || '0', 10);
      const hours = Math.max(1, endH - startH);
      stats[subj] = (stats[subj] || 0) + hours;
    });
    return stats;
  }, [dayMissions]);

  const plannedSlices = Object.entries(subjectStats).map(([label, value]) => ({
    label,
    value,
    color: getSubjectColor(label),
  }));

  const executedSlices = dayMissions
    .filter((m: DailyMission) => m.status === 'completed' || (m.progress && m.progress >= 100))
    .reduce((acc: { label: string; value: number; color: string }[], m: DailyMission) => {
      const subj = m.subject || '기타';
      const existing = acc.find((s) => s.label === subj);
      const startH = parseInt(m.startTime?.split(':')[0] || '0', 10);
      const endH = parseInt(m.endTime?.split(':')[0] || '0', 10);
      const hours = Math.max(1, endH - startH);
      if (existing) existing.value += hours;
      else acc.push({ label: subj, value: hours, color: getSubjectColor(subj) });
      return acc;
    }, []);

  // 미션 편집
  const handleEditMission = (mission: DailyMission) => {
    setEditTarget(mission);
    setIsCreatingNew(false);
    setMissionDialogOpen(true);
  };

  // 새 미션
  const handleNewMission = () => {
    setEditTarget(null);
    setIsCreatingNew(true);
    setMissionDialogOpen(true);
  };

  // 결과 입력 열기
  const handleOpenResult = (mission: DailyMission, e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭(수정) 방지
    setResultTarget(mission);
    setResultDialogOpen(true);
  };

  // 미션 저장
  const handleSaveMission = (data: MissionFormData, missionId?: number) => {
    const planStart = Number(data.startPage) || undefined;
    const planEnd = Number(data.endPage) || undefined;
    const planAmount = planStart && planEnd ? planEnd - planStart : undefined;

    if (isCreatingNew) {
      createMutation.mutate(
        {
          date: dateStr,
          startTime: data.startTime,
          endTime: data.endTime,
          subject: data.subject || undefined,
          content: data.title || data.content || undefined,
          startPage: planStart,
          endPage: planEnd,
          amount: planAmount,
        },
        {
          onSuccess: () => toast.success('미션이 추가되었습니다!'),
          onError: () => toast.error('미션 추가에 실패했습니다.'),
        },
      );
    } else if (missionId) {
      updateMutation.mutate(
        {
          missionId,
          data: {
            startTime: data.startTime,
            endTime: data.endTime,
            subject: data.subject,
            content: data.title || data.content,
            startPage: planStart,
            endPage: planEnd,
            amount: planAmount,
          },
        },
        {
          onSuccess: () => toast.success('미션이 수정되었습니다!'),
          onError: () => toast.error('미션 수정에 실패했습니다.'),
        },
      );
    }
  };

  // 결과 저장
  const upsertReflection = useUpsertReflection();

  const handleSaveResult = (missionId: number, data: ResultFormData) => {
    const resultStart = Number(data.startPage) || undefined;
    const resultEnd = Number(data.endPage) || undefined;
    const resultAmount = resultStart && resultEnd ? resultEnd - resultStart : undefined;
    const progressNum = Number(data.progress) || 0;

    updateMutation.mutate(
      {
        missionId,
        data: {
          status: progressNum >= 100 ? 'completed' : 'pending',
          result: {
            startPage: resultStart,
            endPage: resultEnd,
            amount: resultAmount,
            achievementRate: progressNum / 100,
            note: data.memo || undefined,
          },
        },
      },
      {
        onSuccess: () => {
          if (progressNum >= 100) {
            triggerConfetti();
            toast.success('마션 완료! 🎉 또 한 걸음 성장했어요!');
          } else {
            toast.success('결과가 저장되었습니다!');
          }
          // 이해도 회고에 저장
          if (data.understanding) {
            upsertReflection.mutate({
              date: dateStr,
              mood: 'okay', // 기본값, 성장 페이지에서 수정 가능
              understanding: data.understanding,
            });
          }
        },
        onError: () => toast.error('결과 저장에 실패했습니다.'),
      },
    );
  };

  // 삭제
  const handleDeleteMission = (missionId: number) => {
    if (!confirm('이 미션을 삭제하시겠습니까?')) return;
    deleteMutation.mutate(missionId, {
      onSuccess: () => {
        toast.success('미션이 삭제되었습니다.');
        setMissionDialogOpen(false);
      },
    });
  };

  // 타임블록 캘린더 상수
  const CALENDAR_START_HOUR = 6;
  const CALENDAR_END_HOUR = 24;
  const HOUR_HEIGHT = 48; // px per hour
  const TOTAL_HOURS = CALENDAR_END_HOUR - CALENDAR_START_HOUR;

  // 타임라인 아이템을 시간 기반 위치로 변환
  const timeBlocks = useMemo(() => {
    return timelineItems.map((item) => {
      const data = item.data;
      const [startH, startM] = (data.startTime || '09:00').split(':').map(Number);
      const [endH, endM] = (data.endTime || '10:00').split(':').map(Number);

      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      const calendarStartMinutes = CALENDAR_START_HOUR * 60;

      const top = Math.max(0, ((startMinutes - calendarStartMinutes) / 60) * HOUR_HEIGHT);
      const height = Math.max(HOUR_HEIGHT * 0.4, ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT);

      return { ...item, top, height };
    });
  }, [timelineItems, HOUR_HEIGHT]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="text-sm text-gray-500">불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 pb-24">
      {/* ===== 헤더 ===== */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="rounded-lg p-2 transition-colors hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">금일계획</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
            {completedMissions}/{totalMissions} 완료
          </span>
          {totalMissions > 0 && <span className="text-xs text-gray-400">{progressPercent}%</span>}
        </div>
      </div>

      {/* ===== 날짜 네비 + 목표 통합 ===== */}
      <Card className="mb-3">
        <CardContent className="p-2.5">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateDate('prev')}
              className="rounded-full p-1.5 transition-colors hover:bg-gray-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-800">
                {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 (
                {DAYS_KR[selectedDate.getDay()]})
              </h2>
              {isToday && (
                <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                  오늘
                </span>
              )}
              {!isToday && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  className="h-6 px-2 text-[10px]"
                >
                  오늘로
                </Button>
              )}
            </div>
            <button
              onClick={() => navigateDate('next')}
              className="rounded-full p-1.5 transition-colors hover:bg-gray-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          {/* 목표 인라인 */}
          <div className="mt-1.5 flex items-center gap-1.5 border-t border-gray-100 pt-1.5">
            <Target className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
            {isEditingGoal ? (
              <Input
                value={dailyGoal}
                onChange={(e) => setDailyGoal(e.target.value)}
                placeholder="오늘의 목표를 입력하세요..."
                className="h-6 flex-1 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingGoal(false)}
                onBlur={() => setIsEditingGoal(false)}
              />
            ) : (
              <p
                onClick={() => setIsEditingGoal(true)}
                className="flex-1 cursor-pointer truncate text-xs text-gray-500 hover:text-gray-700"
              >
                {dailyGoal || <span className="text-gray-300">🎯 목표를 입력하세요...</span>}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ===== 하루 타임 블록 캘린더 ===== */}
      <Card className="mb-4">
        <CardContent className="p-0">
          <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2.5">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-semibold text-gray-700">하루 일정</span>
            <span className="ml-auto text-[10px] text-gray-400">{timelineItems.length}개 일정</span>
          </div>

          <div className="relative overflow-y-auto" style={{ maxHeight: '420px' }}>
            <div
              className="relative"
              style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px`, minHeight: '200px' }}
            >
              {/* 시간 눈금 */}
              {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
                const hour = CALENDAR_START_HOUR + i;
                return (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 flex items-start"
                    style={{ top: `${i * HOUR_HEIGHT}px` }}
                  >
                    <span className="w-10 flex-shrink-0 pr-1 text-right text-[10px] text-gray-400">
                      {hour < 24 ? `${String(hour).padStart(2, '0')}:00` : ''}
                    </span>
                    <div className="h-px flex-1 bg-gray-100" />
                  </div>
                );
              })}

              {/* 현재 시간 표시 */}
              {isToday &&
                (() => {
                  const now = new Date();
                  const nowMinutes = now.getHours() * 60 + now.getMinutes();
                  const calendarStartMinutes = CALENDAR_START_HOUR * 60;
                  if (nowMinutes >= calendarStartMinutes && nowMinutes <= CALENDAR_END_HOUR * 60) {
                    const top = ((nowMinutes - calendarStartMinutes) / 60) * HOUR_HEIGHT;
                    return (
                      <div
                        className="absolute right-0 z-10 flex items-center"
                        style={{ top: `${top}px`, left: '36px' }}
                      >
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        <div className="h-px flex-1 bg-red-400" />
                      </div>
                    );
                  }
                  return null;
                })()}

              {/* 타임 블록들 */}
              {timeBlocks.map((block) => {
                if (block.type === 'routine') {
                  const routine = block.data;
                  const rColor =
                    routine.majorCategory === 'class'
                      ? '#3b82f6'
                      : routine.majorCategory === 'self_study'
                        ? '#10b981'
                        : routine.majorCategory === 'exercise'
                          ? '#f59e0b'
                          : '#8b5cf6';
                  const categoryLabel =
                    routine.majorCategory === 'class'
                      ? '수업'
                      : routine.majorCategory === 'self_study'
                        ? '자습'
                        : routine.majorCategory === 'exercise'
                          ? '운동'
                          : '일정';

                  return (
                    <div
                      key={`routine-${routine.id}`}
                      className="absolute overflow-hidden rounded-md border"
                      style={{
                        top: `${block.top}px`,
                        height: `${block.height - 2}px`,
                        left: '44px',
                        right: '8px',
                        backgroundColor: `${rColor}12`,
                        borderColor: `${rColor}30`,
                        borderLeftWidth: '3px',
                        borderLeftColor: rColor,
                      }}
                    >
                      <div className="flex h-full items-start gap-1.5 px-2 py-1">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <span
                              className="rounded px-1 py-px text-[9px] font-bold text-white"
                              style={{ backgroundColor: rColor }}
                            >
                              {categoryLabel}
                            </span>
                            <span className="text-[9px] text-gray-400">루틴</span>
                          </div>
                          <p className="mt-0.5 truncate text-[11px] font-medium text-gray-700">
                            {routine.title}
                          </p>
                          {routine.subject && block.height > 40 && (
                            <p className="truncate text-[10px] text-gray-400">{routine.subject}</p>
                          )}
                        </div>
                        <span className="flex-shrink-0 text-[9px] text-gray-400">
                          {routine.startTime}
                        </span>
                      </div>
                    </div>
                  );
                }

                // 미션 블록
                const mission = block.data;
                const color = getSubjectColor(mission.subject);
                const isCompleted =
                  mission.status === 'completed' || (mission.progress && mission.progress >= 100);
                const completionRate = isCompleted ? 100 : mission.progress || 0;

                return (
                  <div
                    key={`mission-${mission.id}`}
                    className="absolute cursor-pointer overflow-hidden rounded-md border transition-shadow hover:shadow-md"
                    style={{
                      top: `${block.top}px`,
                      height: `${block.height - 2}px`,
                      left: '44px',
                      right: '8px',
                      backgroundColor: isCompleted ? '#f0fdf4' : '#ffffff',
                      borderColor: isCompleted ? '#bbf7d0' : `${color}40`,
                      borderLeftWidth: '3px',
                      borderLeftColor: isCompleted ? '#22c55e' : color,
                    }}
                    onClick={() => handleEditMission(mission)}
                  >
                    <div className="flex h-full items-start gap-1.5 px-2 py-1">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span
                            className="rounded px-1 py-px text-[9px] font-bold text-white"
                            style={{ backgroundColor: color }}
                          >
                            {mission.subject || '미지정'}
                          </span>
                          {isCompleted && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                        </div>
                        <p
                          className={`mt-0.5 truncate text-[11px] font-medium ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}`}
                        >
                          {mission.content || mission.title || '(내용 없음)'}
                        </p>
                        {block.height > 45 && (mission.startPage || mission.endPage) && (
                          <p className="truncate text-[10px] text-gray-400">
                            p.{mission.startPage}~{mission.endPage}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-shrink-0 flex-col items-end gap-0.5">
                        <span className="text-[9px] text-gray-400">{mission.startTime}</span>
                        {completionRate > 0 && !isCompleted && (
                          <span className="rounded bg-purple-100 px-1 text-[9px] font-bold text-purple-600">
                            {completionRate}%
                          </span>
                        )}
                        {!isCompleted && (
                          <button
                            onClick={(e) => handleOpenResult(mission, e)}
                            className="mt-auto rounded bg-purple-50 px-1 py-px text-[9px] font-semibold text-purple-500 transition-colors hover:bg-purple-100"
                          >
                            결과
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* 빈 상태 */}
              {timelineItems.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <BookOpen className="mb-2 h-8 w-8 text-gray-200" />
                  <p className="text-xs text-gray-400">오늘의 일정이 없습니다</p>
                  <p className="mt-0.5 text-[10px] text-gray-300">+ 버튼으로 미션을 추가하세요</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== 미션 리스트 (상호작용 포인트) ===== */}
      {timelineItems.length > 0 && (
        <Card className="mb-4">
          <CardContent className="p-0">
            <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2.5">
              <BookOpen className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-semibold text-gray-700">미션 목록</span>
              <span className="ml-auto text-[10px] text-gray-400">탭하여 수정</span>
            </div>

            <div className="divide-y divide-gray-50">
              {timelineItems.map((item) => {
                if (item.type === 'routine') {
                  const routine = item.data;
                  const rColor =
                    routine.majorCategory === 'class'
                      ? '#3b82f6'
                      : routine.majorCategory === 'self_study'
                        ? '#10b981'
                        : routine.majorCategory === 'exercise'
                          ? '#f59e0b'
                          : '#8b5cf6';
                  return (
                    <div
                      key={`list-routine-${routine.id}`}
                      className="flex items-center gap-2.5 px-4 py-2.5"
                    >
                      <div
                        className="flex h-8 w-14 flex-shrink-0 flex-col items-center justify-center rounded-md"
                        style={{ backgroundColor: `${rColor}12` }}
                      >
                        <span className="text-[10px] font-bold" style={{ color: rColor }}>
                          {routine.startTime}
                        </span>
                        <span className="text-[8px] text-gray-400">{routine.endTime}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span
                            className="rounded px-1 py-px text-[9px] font-bold text-white"
                            style={{ backgroundColor: rColor }}
                          >
                            {routine.majorCategory === 'class'
                              ? '수업'
                              : routine.majorCategory === 'self_study'
                                ? '자습'
                                : routine.majorCategory === 'exercise'
                                  ? '운동'
                                  : '일정'}
                          </span>
                          <span className="text-[9px] text-gray-400">루틴</span>
                        </div>
                        <p className="mt-0.5 truncate text-xs font-medium text-gray-700">
                          {routine.title}
                        </p>
                      </div>
                    </div>
                  );
                }

                const mission = item.data;
                const color = getSubjectColor(mission.subject);
                const isCompleted =
                  mission.status === 'completed' || (mission.progress && mission.progress >= 100);
                const completionRate = isCompleted ? 100 : mission.progress || 0;

                return (
                  <div
                    key={`list-mission-${mission.id}`}
                    className="flex items-center gap-2.5 px-4 py-2.5"
                  >
                    <button
                      onClick={() => handleEditMission(mission)}
                      className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                    >
                      <div className="flex h-8 w-14 flex-shrink-0 flex-col items-center justify-center rounded-md bg-gray-50">
                        <span className="text-[10px] font-bold text-gray-600">
                          {mission.startTime}
                        </span>
                        <span className="text-[8px] text-gray-400">{mission.endTime}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span
                            className="rounded px-1 py-px text-[9px] font-bold text-white"
                            style={{ backgroundColor: color }}
                          >
                            {mission.subject || '미지정'}
                          </span>
                          {isCompleted && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                          {completionRate > 0 && !isCompleted && (
                            <span className="text-[9px] font-bold text-purple-500">
                              {completionRate}%
                            </span>
                          )}
                        </div>
                        <p
                          className={`mt-0.5 truncate text-xs font-medium ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}`}
                        >
                          {mission.content || mission.title || '(내용 없음)'}
                        </p>
                      </div>
                    </button>

                    {/* 수정 / 결과 버튼 */}
                    <div className="flex flex-shrink-0 items-center gap-1.5">
                      <button
                        onClick={() => handleEditMission(mission)}
                        className="rounded-md border border-gray-200 px-2 py-1 text-[10px] font-medium text-gray-500 transition-colors hover:bg-gray-50"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => handleOpenResult(mission, e)}
                        className={`rounded-md border px-2 py-1 text-[10px] font-semibold transition-colors ${
                          isCompleted
                            ? 'border-green-200 bg-green-50 text-green-600'
                            : 'border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-100'
                        }`}
                      >
                        {isCompleted ? '✓ 완료' : '📝 결과'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== 오늘 성과 ===== */}
      {dayMissions.length > 0 && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-semibold text-gray-700">오늘 성과</span>
              <span className="ml-auto rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-600">
                달성률 {progressPercent}%
              </span>
            </div>

            {/* 진행률 바 */}
            <div className="mb-3 rounded-lg bg-gray-50 p-3">
              <div className="mb-1.5 flex items-center justify-between text-[11px]">
                <span className="text-gray-500">
                  완료 {completedMissions} / 전체 {totalMissions}
                </span>
                <span
                  className={`font-bold ${progressPercent >= 100 ? 'text-green-600' : 'text-blue-600'}`}
                >
                  {progressPercent}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: progressPercent >= 100 ? '#22c55e' : '#3b82f6',
                  }}
                />
              </div>
            </div>

            {/* 미션별 빠른 결과 입력 */}
            <div className="mb-4 space-y-1">
              {dayMissions.map((mission: DailyMission) => {
                const color = getSubjectColor(mission.subject);
                const isCompleted =
                  mission.status === 'completed' || (mission.progress && mission.progress >= 100);
                const completionRate = isCompleted ? 100 : mission.progress || 0;

                return (
                  <button
                    key={`perf-${mission.id}`}
                    onClick={(e) => handleOpenResult(mission, e)}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
                      isCompleted
                        ? 'bg-green-50 hover:bg-green-100'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    {/* 상태 아이콘 */}
                    <div
                      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${
                        isCompleted ? 'bg-green-500' : 'border-2 border-gray-300'
                      }`}
                    >
                      {isCompleted && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                    </div>

                    {/* 과목 + 제목 */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-[10px] font-medium text-gray-500">
                          {mission.subject || '미지정'}
                        </span>
                      </div>
                      <p
                        className={`truncate text-xs ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}`}
                      >
                        {mission.content || mission.title || '(내용 없음)'}
                      </p>
                    </div>

                    {/* 진행률 */}
                    <div className="flex flex-shrink-0 items-center gap-1.5">
                      {completionRate > 0 ? (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                            isCompleted
                              ? 'bg-green-100 text-green-600'
                              : 'bg-purple-100 text-purple-600'
                          }`}
                        >
                          {completionRate}%
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
                          미입력
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 도넛 차트 */}
            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-3">
              <DonutChart slices={plannedSlices} title="📋 계획 시간" totalLabel="총 계획" />
              <DonutChart slices={executedSlices} title="✅ 실행 시간" totalLabel="총 실행" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* FAB */}
      <button
        onClick={handleNewMission}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200 transition-all hover:scale-105 hover:shadow-xl active:scale-95 md:right-[calc(50%-20rem)]"
      >
        <Plus className="h-7 w-7" />
      </button>

      {/* 미션 생성/수정 다이얼로그 */}
      <MissionDialog
        mission={editTarget}
        open={missionDialogOpen}
        onOpenChange={setMissionDialogOpen}
        onSave={handleSaveMission}
        onDelete={handleDeleteMission}
        isNew={isCreatingNew}
      />

      {/* 결과 입력 다이얼로그 */}
      <ResultDialog
        mission={resultTarget}
        open={resultDialogOpen}
        onOpenChange={setResultDialogOpen}
        onSave={handleSaveResult}
      />
    </div>
  );
}
