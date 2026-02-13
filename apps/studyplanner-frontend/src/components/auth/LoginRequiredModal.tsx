/**
 * 로그인 필요 모달
 *
 * 비로그인 상태에서 액션을 시도할 때 표시됩니다.
 */

import { Link } from '@tanstack/react-router';
import { LogIn, UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface LoginRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginRequiredModal({ open, onOpenChange }: LoginRequiredModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader className="text-center sm:text-center">
          <div className="bg-ultrasonic-50 mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full">
            <LogIn className="text-ultrasonic-500 h-7 w-7" />
          </div>
          <DialogTitle className="text-xl">로그인이 필요합니다</DialogTitle>
          <DialogDescription className="text-base">
            이 기능을 사용하려면 로그인해 주세요.
            <br />
            학생, 선생님, 학부모가 함께 하는
            <br />
            스터디플래너를 시작하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex flex-col gap-3">
          <Link
            to="/auth/login"
            className="bg-ultrasonic-500 hover:bg-ultrasonic-600 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-base font-semibold text-white transition-colors"
            onClick={() => onOpenChange(false)}
          >
            <LogIn className="h-5 w-5" />
            로그인
          </Link>
          <Link
            to="/auth/register"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-base font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            onClick={() => onOpenChange(false)}
          >
            <UserPlus className="h-5 w-5" />
            회원가입
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
