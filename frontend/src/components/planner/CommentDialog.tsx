/**
 * 코멘트 다이얼로그 컴포넌트
 * 미션/루틴/계획에 대한 코멘트를 보고 작성하는 UI
 */

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Check, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  useGetComments,
  useCreateComment,
  useMarkCommentAsRead,
  type PlannerComment,
} from '@/stores/server/planner/comments';
import { useAuthStore } from '@/stores/client';

// ============================================
// Props
// ============================================

interface CommentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 코멘트 대상 */
  target: {
    studentId: number;
    missionId?: number;
    routineId?: number;
    planId?: number;
    title: string;
    subject?: string;
  };
}

// ============================================
// 코멘트 아이템 컴포넌트
// ============================================

function CommentBubble({
  comment,
  isMine,
  onMarkRead,
}: {
  comment: PlannerComment;
  isMine: boolean;
  onMarkRead: (id: number) => void;
}) {
  const roleLabel =
    comment.authorRole === 'teacher'
      ? '선생님'
      : comment.authorRole === 'parent'
        ? '학부모'
        : '학생';

  const roleColor =
    comment.authorRole === 'teacher'
      ? 'bg-indigo-100 text-indigo-700'
      : comment.authorRole === 'parent'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-emerald-100 text-emerald-700';

  const bubbleColor = isMine ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-800';

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '방금';
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    return `${days}일 전`;
  };

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[80%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* 작성자 정보 */}
        {!isMine && (
          <div className="mb-1 flex items-center gap-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">
              {comment.author?.name?.charAt(0) || <User className="h-3 w-3" />}
            </div>
            <span className="text-xs font-medium text-gray-600">
              {comment.author?.name || '알 수 없음'}
            </span>
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${roleColor}`}>
              {roleLabel}
            </span>
          </div>
        )}

        {/* 메시지 버블 */}
        <div
          className={`rounded-2xl px-4 py-2.5 ${bubbleColor} ${isMine ? 'rounded-tr-md' : 'rounded-tl-md'}`}
        >
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{comment.content}</p>
        </div>

        {/* 시간 + 읽음 */}
        <div className={`mt-1 flex items-center gap-1.5 ${isMine ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] text-gray-400">{timeAgo(comment.createdAt)}</span>
          {!isMine && !comment.isRead && (
            <button
              onClick={() => onMarkRead(comment.id)}
              className="flex items-center gap-0.5 text-[10px] text-indigo-500 hover:text-indigo-600"
            >
              <Check className="h-3 w-3" />
              읽음
            </button>
          )}
          {comment.isRead && !isMine && <span className="text-[10px] text-gray-300">읽음</span>}
        </div>
      </div>
    </div>
  );
}

// ============================================
// 메인 다이얼로그 컴포넌트
// ============================================

export function CommentDialog({ open, onOpenChange, target }: CommentDialogProps) {
  const user = useAuthStore((s) => s.user);
  const [newComment, setNewComment] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useGetComments({
    studentId: target.studentId,
    missionId: target.missionId,
    routineId: target.routineId,
    planId: target.planId,
  });

  const createMutation = useCreateComment();
  const markReadMutation = useMarkCommentAsRead();

  const comments = data?.comments || [];

  // 새 메시지가 추가되면 스크롤 하단으로
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments.length]);

  const handleSend = () => {
    if (!newComment.trim() || !user) return;

    createMutation.mutate(
      {
        studentId: target.studentId,
        authorId: String(user.id),
        authorRole: 'student',
        missionId: target.missionId,
        routineId: target.routineId,
        planId: target.planId,
        content: newComment.trim(),
        subject: target.subject,
        period: target.missionId ? 'daily' : target.routineId ? 'weekly' : 'monthly',
      },
      {
        onSuccess: () => setNewComment(''),
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] flex-col sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-indigo-500" />
            코멘트
          </DialogTitle>
          <DialogDescription className="text-xs">
            {target.title}
            {target.subject && (
              <span className="ml-1.5 rounded bg-gray-100 px-1.5 py-0.5 text-gray-600">
                {target.subject}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* 코멘트 목록 */}
        <div ref={scrollRef} className="min-h-[200px] flex-1 overflow-y-auto px-1 py-2">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-600" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-8 text-gray-400">
              <MessageSquare className="mb-2 h-8 w-8" />
              <p className="text-sm">아직 코멘트가 없습니다</p>
              <p className="mt-1 text-xs">첫 번째 코멘트를 남겨보세요!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <CommentBubble
                key={comment.id}
                comment={comment}
                isMine={comment.authorId === String(user?.id)}
                onMarkRead={(id) => markReadMutation.mutate(id)}
              />
            ))
          )}
        </div>

        {/* 입력 영역 */}
        <div className="flex items-end gap-2 border-t pt-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="코멘트를 입력하세요..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-200"
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!newComment.trim() || createMutation.isPending}
            className="h-10 w-10 rounded-xl bg-indigo-500 p-0 hover:bg-indigo-600"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
