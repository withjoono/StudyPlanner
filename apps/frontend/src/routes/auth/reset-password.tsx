import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useState } from 'react';
import { usePasswordResetRequest, useVerifyResetCode, usePasswordReset } from '@/stores/server/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Loader2, Mail, Phone, Lock, ArrowLeft, CheckCircle } from 'lucide-react';

export const Route = createFileRoute('/auth/reset-password')({
  component: ResetPasswordPage,
});

const step1Schema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  phone: z.string().regex(/^01[0-9]-?[0-9]{4}-?[0-9]{4}$/, '올바른 휴대폰 번호 형식이 아닙니다'),
});

const step2Schema = z.object({
  code: z.string().length(6, '인증번호 6자리를 입력해주세요'),
});

const step3Schema = z
  .object({
    newPassword: z
      .string()
      .min(8, '비밀번호는 8자 이상이어야 합니다')
      .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, '영문과 숫자를 포함해야 합니다'),
    newPasswordConfirm: z.string(),
  })
  .refine((data) => data.newPassword === data.newPasswordConfirm, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['newPasswordConfirm'],
  });

type Step1Form = z.infer<typeof step1Schema>;
type Step2Form = z.infer<typeof step2Schema>;
type Step3Form = z.infer<typeof step3Schema>;

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [phone, setPhone] = useState('');

  const requestMutation = usePasswordResetRequest();
  const verifyMutation = useVerifyResetCode();
  const resetMutation = usePasswordReset();

  const step1Form = useForm<Step1Form>({
    resolver: zodResolver(step1Schema),
  });

  const step2Form = useForm<Step2Form>({
    resolver: zodResolver(step2Schema),
  });

  const step3Form = useForm<Step3Form>({
    resolver: zodResolver(step3Schema),
  });

  const onStep1Submit = async (data: Step1Form) => {
    try {
      await requestMutation.mutateAsync(data);
      setPhone(data.phone);
      setStep(2);
      toast.success('인증번호가 발송되었습니다');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || '인증번호 발송에 실패했습니다');
    }
  };

  const onStep2Submit = async (data: Step2Form) => {
    try {
      const response = await verifyMutation.mutateAsync({ phone, code: data.code });
      setResetToken(response.token);
      setStep(3);
      toast.success('인증이 완료되었습니다');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || '인증번호가 일치하지 않습니다');
    }
  };

  const onStep3Submit = async (data: Step3Form) => {
    if (!resetToken) return;

    try {
      await resetMutation.mutateAsync({ token: resetToken, newPassword: data.newPassword });
      toast.success('비밀번호가 변경되었습니다');
      navigate({ to: '/auth/login' });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || '비밀번호 변경에 실패했습니다');
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">비밀번호 재설정</h1>
          <p className="mt-2 text-sm text-gray-600">
            {step === 1 && '가입 시 사용한 이메일과 휴대폰 번호를 입력해주세요'}
            {step === 2 && '휴대폰으로 전송된 인증번호를 입력해주세요'}
            {step === 3 && '새로운 비밀번호를 입력해주세요'}
          </p>
        </div>

        {/* 단계 표시 */}
        <div className="mb-6 flex justify-center">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  step >= s
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step > s ? <CheckCircle className="h-4 w-4" /> : s}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: 이메일 & 휴대폰 입력 */}
        {step === 1 && (
          <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="가입한 이메일을 입력하세요"
                  className="pl-10"
                  {...step1Form.register('email')}
                />
              </div>
              {step1Form.formState.errors.email && (
                <p className="text-sm text-red-500">{step1Form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">휴대폰 번호</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="phone"
                  placeholder="010-1234-5678"
                  className="pl-10"
                  {...step1Form.register('phone')}
                />
              </div>
              {step1Form.formState.errors.phone && (
                <p className="text-sm text-red-500">{step1Form.formState.errors.phone.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={requestMutation.isPending}>
              {requestMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  발송 중...
                </>
              ) : (
                '인증번호 발송'
              )}
            </Button>
          </form>
        )}

        {/* Step 2: 인증번호 입력 */}
        {step === 2 && (
          <form onSubmit={step2Form.handleSubmit(onStep2Submit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">인증번호</Label>
              <Input
                id="code"
                placeholder="인증번호 6자리를 입력하세요"
                maxLength={6}
                {...step2Form.register('code')}
              />
              {step2Form.formState.errors.code && (
                <p className="text-sm text-red-500">{step2Form.formState.errors.code.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={verifyMutation.isPending}>
              {verifyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  확인 중...
                </>
              ) : (
                '인증번호 확인'
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setStep(1)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              이전으로
            </Button>
          </form>
        )}

        {/* Step 3: 새 비밀번호 입력 */}
        {step === 3 && (
          <form onSubmit={step3Form.handleSubmit(onStep3Submit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">새 비밀번호</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="8자 이상, 영문+숫자"
                  className="pl-10"
                  {...step3Form.register('newPassword')}
                />
              </div>
              {step3Form.formState.errors.newPassword && (
                <p className="text-sm text-red-500">
                  {step3Form.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPasswordConfirm">새 비밀번호 확인</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="newPasswordConfirm"
                  type="password"
                  placeholder="비밀번호를 다시 입력하세요"
                  className="pl-10"
                  {...step3Form.register('newPasswordConfirm')}
                />
              </div>
              {step3Form.formState.errors.newPasswordConfirm && (
                <p className="text-sm text-red-500">
                  {step3Form.formState.errors.newPasswordConfirm.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={resetMutation.isPending}>
              {resetMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  변경 중...
                </>
              ) : (
                '비밀번호 변경'
              )}
            </Button>
          </form>
        )}

        {/* 하단 링크 */}
        <div className="mt-6 text-center text-sm">
          <Link to="/auth/login" className="text-gray-500 hover:text-gray-700">
            로그인으로 돌아가기
          </Link>
        </div>
      </Card>
    </div>
  );
}




