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
  Sparkles,
  BarChart3,
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
import { Button } from 'geobuk-shared/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from 'geobuk-shared/ui';
import { Input } from 'geobuk-shared/ui';
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
        <div className="rounded-t-lg px-5 py-3" style={{ backgroundColor: `${color}15` }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold" style={{ color }}>
              <ClipboardCheck className="h-4.5 w-4.5" />
              결과 입력
            </DialogTitle>
          </DialogHeader>
          <p className="mt-1 text-xs" style={{ color: `${color}99` }}>
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
// 루틴 상세 시트
// ============================================
function RoutineDetailSheet({
  routine,
  open,
  onOpenChange,
  onConvertToMission,
}: {
  routine: Routine | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConvertToMission: (routine: Routine) => void;
}) {
  if (!routine) return null;

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 sm:max-w-[380px]">
        {/* 헤더 */}
        <div className="rounded-t-lg px-5 py-4" style={{ backgroundColor: `${rColor}15` }}>
          <DialogHeader>
            <DialogTitle
              className="flex items-center gap-2 text-base font-bold"
              style={{ color: rColor }}
            >
              <Clock className="h-4.5 w-4.5" />
              {categoryLabel}: {routine.title}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 flex items-center gap-3 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {routine.startTime || '00:00'} ~ {routine.endTime || '00:00'}
            </span>
            {routine.subject && (
              <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium">
                {routine.subject}
              </span>
            )}
          </div>
        </div>

        {/* 액션 */}
        <div className="space-y-2 px-5 pb-5 pt-3">
          <button
            onClick={() => {
              onConvertToMission(routine);
              onOpenChange(false);
            }}
            className="flex w-full items-center gap-3 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-left transition-colors hover:bg-purple-100 active:bg-purple-200"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-white">
              <ClipboardCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-purple-700">미션으로 변환하여 결과 입력</p>
              <p className="text-[11px] text-purple-500">
                오늘의 미션으로 복사하고 학습 결과를 기록합니다
              </p>
            </div>
          </button>

          <Link
            to="/routine"
            onClick={() => onOpenChange(false)}
            className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-400 text-white">
              <Pencil className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">주간루틴에서 수정</p>
              <p className="text-[11px] text-gray-500">루틴 설정 페이지로 이동합니다</p>
            </div>
          </Link>

          <Button variant="outline" className="mt-2 w-full" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
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

  // 루틴 상세 시트 상태
  const [routineSheetOpen, setRoutineSheetOpen] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);

  // 탭 상태 (계획/결과/분석)
  const [activeTab, setActiveTab] = useState<'plan' | 'result' | 'analysis'>('plan');

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

  // 루틴 클릭
  const handleRoutineClick = (routine: Routine) => {
    setSelectedRoutine(routine);
    setRoutineSheetOpen(true);
  };

  // 루틴 → 미션 변환
  const handleConvertRoutineToMission = (routine: Routine) => {
    createMutation.mutate(
      {
        date: dateStr,
        startTime: routine.startTime || '09:00',
        endTime: routine.endTime || '10:00',
        subject: routine.subject || undefined,
        content: routine.title || undefined,
      },
      {
        onSuccess: (created: any) => {
          toast.success('미션으로 변환되었습니다!');
          // 생성된 미션으로 ResultDialog 자동 오픈
          if (created && created.id) {
            setResultTarget(created);
            setResultDialogOpen(true);
          }
        },
        onError: () => {
          toast.error('미션 생성에 실패했습니다.');
        },
      },
    );
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
    <div className="min-h-screen bg-gray-50">
      {/* ═══════ 히어로 헤더 — 대시보드 디자인 통일 ═══════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-800 px-4 pb-20 pt-6 text-white md:pb-24 md:pt-8">
        {/* 배경 장식 */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-indigo-400/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl">
          {/* 상단: 타이틀 + 날짜 뱃지 */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link to="/" className="rounded-full p-1.5 transition-colors hover:bg-white/10">
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-lg font-bold tracking-tight md:text-xl">금일계획</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                <Sparkles className="h-3 w-3 text-yellow-300" />
                {isToday
                  ? '오늘'
                  : `D${Math.round((selectedDate.getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000)}`}
              </div>
            </div>
          </div>

          {/* 날짜 네비게이션 */}
          <div className="mb-4 flex items-center justify-center gap-4">
            <button
              onClick={() => navigateDate('prev')}
              className="rounded-full p-2 transition-colors hover:bg-white/10"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="text-center">
              <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
                {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
              </h2>
              <p className="mt-0.5 text-sm text-blue-200">
                {DAYS_KR[selectedDate.getDay()]}요일
                {!isToday && (
                  <button
                    onClick={goToToday}
                    className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-white/30"
                  >
                    오늘로
                  </button>
                )}
              </p>
            </div>
            <button
              onClick={() => navigateDate('next')}
              className="rounded-full p-2 transition-colors hover:bg-white/10"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* 통계 3카드 */}
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                label: '미션',
                value: totalMissions > 0 ? `${completedMissions}/${totalMissions}` : '-',
                gradient: 'from-blue-400 to-blue-500',
              },
              {
                label: '달성률',
                value: totalMissions > 0 ? `${progressPercent}%` : '-',
                gradient: 'from-emerald-400 to-emerald-500',
              },
              {
                label: '학습시간',
                value: (() => {
                  const hrs = Object.values(subjectStats).reduce((s, v) => s + v, 0);
                  return hrs > 0 ? `${hrs}h` : '-';
                })(),
                gradient: 'from-amber-400 to-amber-500',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`rounded-xl bg-gradient-to-br ${stat.gradient} p-3 text-center shadow-lg`}
              >
                <div className="text-lg font-extrabold text-white">{stat.value}</div>
                <div className="text-[10px] font-medium text-white/80">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* 오늘 목표 */}
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm">
            <Target className="h-4 w-4 flex-shrink-0 text-yellow-300" />
            {isEditingGoal ? (
              <Input
                value={dailyGoal}
                onChange={(e) => setDailyGoal(e.target.value)}
                placeholder="오늘의 목표를 입력하세요..."
                className="h-6 flex-1 border-0 bg-transparent p-0 text-xs text-white shadow-none placeholder:text-white/40 focus-visible:ring-0"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingGoal(false)}
                onBlur={() => setIsEditingGoal(false)}
              />
            ) : (
              <p
                onClick={() => setIsEditingGoal(true)}
                className="flex-1 cursor-pointer truncate text-xs text-white/70 hover:text-white"
              >
                {dailyGoal || '🎯 목표를 입력하세요...'}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ═══════ 탭 바 + 메인 콘텐츠 ═══════ */}
      <div className="relative mx-auto -mt-10 max-w-2xl px-4 pb-24">
        {/* 탭 바 */}
        <div className="mb-4 flex overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50">
          {[
            { key: 'plan' as const, label: '📋 계획', icon: <BookOpen className="h-4 w-4" /> },
            {
              key: 'result' as const,
              label: '✅ 결과',
              icon: <ClipboardCheck className="h-4 w-4" />,
            },
            { key: 'analysis' as const, label: '📊 분석', icon: <BarChart3 className="h-4 w-4" /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-3 text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? 'border-b-2 border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══════ 계획 탭 ═══════ */}
        {activeTab === 'plan' && (
          <div className="space-y-3">
            {timelineItems.length > 0 ? (
              timelineItems.map((item) => {
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
                      key={`plan-routine-${routine.id}`}
                      className="group flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <div
                        className="w-1 self-stretch rounded-full"
                        style={{ backgroundColor: rColor }}
                      />
                      <div
                        className="flex h-10 w-16 flex-shrink-0 flex-col items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${rColor}12` }}
                      >
                        <span className="text-xs font-bold" style={{ color: rColor }}>
                          {routine.startTime}
                        </span>
                        <span className="text-[9px] text-gray-400">{routine.endTime}</span>
                      </div>
                      {/* 루틴 정보 — 클릭 시 상세 시트 */}
                      <button
                        onClick={() => handleRoutineClick(routine)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className="rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white"
                            style={{ backgroundColor: rColor }}
                          >
                            {categoryLabel}
                          </span>
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium text-gray-400">
                            루틴
                          </span>
                        </div>
                        <p className="mt-1 truncate text-sm font-medium text-gray-800">
                          {routine.title}
                        </p>
                        {routine.subject && (
                          <p className="truncate text-xs text-gray-400">{routine.subject}</p>
                        )}
                      </button>
                      {/* 결과 입력 버튼 — 변환 모달 없이 바로 처리 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConvertRoutineToMission(routine);
                        }}
                        className="flex-shrink-0 rounded-lg bg-purple-50 px-2.5 py-1.5 text-[10px] font-semibold text-purple-600 transition-colors hover:bg-purple-100 active:bg-purple-200"
                      >
                        ✓ 결과
                      </button>
                    </div>
                  );
                }

                // 미션 카드
                const mission = item.data;
                const color = getSubjectColor(mission.subject);
                const isCompleted =
                  mission.status === 'completed' || (mission.progress && mission.progress >= 100);

                return (
                  <div
                    key={`plan-mission-${mission.id}`}
                    className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                    style={{
                      borderLeftWidth: '4px',
                      borderLeftColor: isCompleted ? '#22c55e' : color,
                    }}
                  >
                    <div className="flex h-10 w-16 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-gray-50">
                      <span className="text-xs font-bold text-gray-600">{mission.startTime}</span>
                      <span className="text-[9px] text-gray-400">{mission.endTime}</span>
                    </div>
                    <button
                      onClick={() => handleEditMission(mission)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className="rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white"
                          style={{ backgroundColor: color }}
                        >
                          {mission.subject || '미지정'}
                        </span>
                        {isCompleted && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                        {!isCompleted && mission.progress && mission.progress > 0 && (
                          <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold text-purple-600">
                            {mission.progress}%
                          </span>
                        )}
                      </div>
                      <p
                        className={`mt-1 truncate text-sm font-medium ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}
                      >
                        {mission.content || mission.title || '(내용 없음)'}
                      </p>
                      {(mission.startPage || mission.endPage) && (
                        <p className="text-xs text-gray-400">
                          p.{mission.startPage}~{mission.endPage}
                        </p>
                      )}
                    </button>
                    <div className="flex flex-shrink-0 flex-col items-center gap-1.5">
                      <button
                        onClick={() => handleEditMission(mission)}
                        className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-600"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {isCompleted ? (
                        <button
                          onClick={(e) => handleOpenResult(mission, e)}
                          className="rounded-lg bg-green-50 px-2 py-1 text-[10px] font-semibold text-green-600 transition-colors hover:bg-green-100"
                        >
                          ✓ 완료
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleOpenResult(mission, e)}
                          className="rounded-lg bg-purple-50 px-2.5 py-1.5 text-[10px] font-semibold text-purple-600 transition-colors hover:bg-purple-100 active:bg-purple-200"
                        >
                          ✓ 결과
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white py-16 shadow-sm">
                <BookOpen className="mb-3 h-12 w-12 text-gray-200" />
                <p className="mb-1 text-sm font-medium text-gray-400">오늘의 일정이 없습니다</p>
                <p className="mb-4 text-xs text-gray-300">+ 버튼으로 미션을 추가하세요</p>
                <button
                  onClick={handleNewMission}
                  className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-5 py-2 text-xs font-semibold text-indigo-600 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Plus className="h-3.5 w-3.5" />
                  미션 추가하기
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══════ 결과 탭 ═══════ */}
        {activeTab === 'result' && (
          <div className="space-y-4">
            {/* 전체 진행률 */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-700">전체 달성률</span>
                <span
                  className={`text-2xl font-extrabold ${progressPercent >= 100 ? 'text-green-600' : 'text-indigo-600'}`}
                >
                  {progressPercent}%
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(progressPercent, 100)}%`,
                    background:
                      progressPercent >= 100
                        ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                        : 'linear-gradient(90deg, #6366f1, #4f46e5)',
                  }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                <span>
                  완료 {completedMissions} / 전체 {totalMissions}
                </span>
                <span>{totalMissions - completedMissions}개 남음</span>
              </div>
            </div>

            {/* 미션별 결과 카드 */}
            {dayMissions.length > 0 ? (
              dayMissions.map((mission: DailyMission) => {
                const color = getSubjectColor(mission.subject);
                const isCompleted =
                  mission.status === 'completed' || (mission.progress && mission.progress >= 100);
                const completionRate = isCompleted ? 100 : mission.progress || 0;

                return (
                  <button
                    key={`result-${mission.id}`}
                    onClick={(e) => handleOpenResult(mission, e)}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                      isCompleted
                        ? 'border-green-200 bg-green-50/50'
                        : 'border-gray-100 bg-white shadow-sm'
                    }`}
                  >
                    {/* 상태 원 */}
                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                        isCompleted ? 'bg-green-500' : 'border-2 border-gray-200 bg-white'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-white" />
                      ) : completionRate > 0 ? (
                        <span className="text-[10px] font-bold text-purple-600">
                          {completionRate}%
                        </span>
                      ) : null}
                    </div>

                    {/* 내용 */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs font-medium text-gray-500">
                          {mission.subject || '미지정'}
                        </span>
                        <span className="text-[10px] text-gray-300">
                          {mission.startTime}~{mission.endTime}
                        </span>
                      </div>
                      <p
                        className={`mt-0.5 truncate text-sm font-medium ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}
                      >
                        {mission.content || mission.title || '(내용 없음)'}
                      </p>
                    </div>

                    {/* 결과 상태 */}
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <span className="rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-bold text-green-600">
                          ✓ 완료
                        </span>
                      ) : (
                        <span className="rounded-full bg-purple-100 px-2.5 py-1 text-[10px] font-bold text-purple-600">
                          📝 입력
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white py-12 shadow-sm">
                <ClipboardCheck className="mb-3 h-10 w-10 text-gray-200" />
                <p className="text-sm text-gray-400">결과를 입력할 미션이 없습니다</p>
              </div>
            )}
          </div>
        )}

        {/* ═══════ 분석 탭 ═══════ */}
        {activeTab === 'analysis' && (
          <div className="space-y-4">
            {dayMissions.length > 0 ? (
              <>
                {/* 도넛 차트 */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 text-sm font-bold text-gray-700">📊 과목별 학습 시간</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <DonutChart slices={plannedSlices} title="📋 계획 시간" totalLabel="총 계획" />
                    <DonutChart slices={executedSlices} title="✅ 실행 시간" totalLabel="총 실행" />
                  </div>
                </div>

                {/* 목별 학습 바 */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h3 className="mb-3 text-sm font-bold text-gray-700">📋 과목별 배분</h3>
                  <div className="space-y-2.5">
                    {Object.entries(subjectStats).map(([subject, hours]) => {
                      const color = getSubjectColor(subject);
                      const maxHours = Math.max(...Object.values(subjectStats), 1);
                      return (
                        <div key={subject}>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="inline-block h-2 w-2 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                              <span className="font-medium text-gray-700">{subject}</span>
                            </div>
                            <span className="font-bold text-gray-500">{hours}시간</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${(hours / maxHours) * 100}%`,
                                backgroundColor: color,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 미션 달성 요약 */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h3 className="mb-3 text-sm font-bold text-gray-700">🎯 달성 요약</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-green-50 p-3 text-center">
                      <div className="text-xl font-extrabold text-green-600">
                        {completedMissions}
                      </div>
                      <div className="text-[10px] font-medium text-green-500">완료</div>
                    </div>
                    <div className="rounded-xl bg-amber-50 p-3 text-center">
                      <div className="text-xl font-extrabold text-amber-600">
                        {totalMissions - completedMissions}
                      </div>
                      <div className="text-[10px] font-medium text-amber-500">진행 중</div>
                    </div>
                    <div className="rounded-xl bg-indigo-50 p-3 text-center">
                      <div className="text-xl font-extrabold text-indigo-600">{totalMissions}</div>
                      <div className="text-[10px] font-medium text-indigo-500">전체</div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white py-12 shadow-sm">
                <BarChart3 className="mb-3 h-10 w-10 text-gray-200" />
                <p className="text-sm text-gray-400">분석할 데이터가 없습니다</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FAB — 계획 탭에서만 */}
      {activeTab === 'plan' && (
        <button
          onClick={handleNewMission}
          className="fixed bottom-20 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-200 transition-all hover:scale-105 hover:shadow-xl active:scale-95 md:bottom-6 md:right-[calc(50%-28rem)]"
        >
          <Plus className="h-7 w-7" />
        </button>
      )}

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

      {/* 루틴 상세 시트 */}
      <RoutineDetailSheet
        routine={selectedRoutine}
        open={routineSheetOpen}
        onOpenChange={setRoutineSheetOpen}
        onConvertToMission={handleConvertRoutineToMission}
      />
    </div>
  );
}
