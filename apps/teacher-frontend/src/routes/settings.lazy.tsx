/**
 * 선생님 설정 페이지
 */
import { createLazyFileRoute } from '@tanstack/react-router';
import { Bell, Shield, User, LogOut } from 'lucide-react';

export const Route = createLazyFileRoute('/settings')({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-screen-md px-4 py-6">
      <h2 className="mb-6 text-xl font-bold text-gray-900">설정</h2>

      <div className="space-y-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-800">
            <User className="h-4 w-4 text-emerald-500" />
            프로필
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <span className="text-sm text-gray-600">이름</span>
              <span className="text-sm font-medium">김멘토</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <span className="text-sm text-gray-600">이메일</span>
              <span className="text-sm font-medium">teacher@example.com</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <span className="text-sm text-gray-600">담당 학생</span>
              <span className="text-sm font-medium">12명</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-800">
            <Bell className="h-4 w-4 text-amber-500" />
            알림 설정
          </h3>
          <div className="space-y-3">
            <SettingToggle label="학생 미달 알림" description="학생 완료율 50% 미만 시 알림" defaultChecked />
            <SettingToggle label="학부모 쪽지 알림" description="새로운 쪽지가 도착하면 알림" defaultChecked />
            <SettingToggle label="일일 리포트" description="매일 저녁 전체 학생 요약 알림" defaultChecked={false} />
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-800">
            <Shield className="h-4 w-4 text-green-500" />
            보안
          </h3>
          <button className="w-full rounded-lg border border-gray-200 p-3 text-left text-sm text-gray-600 hover:bg-gray-50">
            비밀번호 변경
          </button>
        </div>

        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600 transition-colors hover:bg-red-100">
          <LogOut className="h-4 w-4" />
          로그아웃
        </button>
      </div>
    </div>
  );
}

function SettingToggle({ label, description, defaultChecked }: { label: string; description: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <label className="relative inline-flex cursor-pointer items-center">
        <input type="checkbox" defaultChecked={defaultChecked} className="peer sr-only" />
        <div className="peer h-5 w-9 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-500 peer-checked:after:translate-x-full" />
      </label>
    </div>
  );
}
