/**
 * 빈 화면 안내 컴포넌트.
 * 거북 마스코트 + 안내 문구 + 행동 버튼으로, 비어 있는 페이지를 친근한 가이드로 바꾼다.
 */
import type { ReactNode } from 'react';
import { TurtleMascot, type TurtleMood } from './TurtleMascot';

interface EmptyStateProps {
  /** 거북이 표정 */
  mood?: TurtleMood;
  title: string;
  description?: string;
  /** 행동 버튼 라벨 (없으면 버튼 숨김) */
  actionLabel?: string;
  /** 버튼 클릭 동작 (actionHref 와 택일) */
  onAction?: () => void;
  /** 버튼을 링크로 동작시킴 (onAction 과 택일) */
  actionHref?: string;
  /** 버튼 라벨 앞 아이콘 */
  actionIcon?: ReactNode;
}

const BTN =
  'mt-4 inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md';

export function EmptyState({
  mood = 'point',
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  actionIcon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white px-6 py-12 shadow-sm">
      <TurtleMascot mood={mood} size={104} />
      <p className="mt-2 text-sm font-bold text-gray-700">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-center text-xs leading-relaxed text-gray-400">
          {description}
        </p>
      )}
      {actionLabel && actionHref && (
        <a href={actionHref} className={BTN}>
          {actionIcon}
          {actionLabel}
        </a>
      )}
      {actionLabel && !actionHref && onAction && (
        <button type="button" onClick={onAction} className={BTN}>
          {actionIcon}
          {actionLabel}
        </button>
      )}
    </div>
  );
}
