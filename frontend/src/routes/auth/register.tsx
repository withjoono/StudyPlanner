import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useState } from 'react';
import { useRegisterWithEmail, useSendCode, useVerifyCode } from '@/stores/server/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Loader2, Mail, Lock, User, Phone, CheckCircle } from 'lucide-react';

export const Route = createFileRoute('/auth/register')({
  component: RegisterPage,
});

const registerSchema = z
  .object({
    email: z.string().email('올바른 이메일 형식이 아닙니다'),
    password: z
      .string()
      .min(8, '비밀번호는 8자 이상이어야 합니다')
      .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, '영문과 숫자를 포함해야 합니다'),
    passwordConfirm: z.string(),
    userName: z.string().min(2, '이름은 2자 이상이어야 합니다'),
    phone: z.string().regex(/^01[0-9]-?[0-9]{4}-?[0-9]{4}$/, '올바른 휴대폰 번호 형식이 아닙니다'),
    verifyCode: z.string().length(6, '인증번호 6자리를 입력해주세요'),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['passwordConfirm'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

function RegisterPage() {
  const navigate = useNavigate();
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);

  const registerMutation = useRegisterWithEmail();
  const sendCodeMutation = useSendCode();
  const verifyCodeMutation = useVerifyCode();

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

  const phone = watch('phone');

  const handleSendCode = async () => {
    const phoneValue = getValues('phone');
    if (!phoneValue || !/^01[0-9]-?[0-9]{4}-?[0-9]{4}$/.test(phoneValue)) {
      toast.error('올바른 휴대폰 번호를 입력해주세요');
      return;
    }

    try {
      await sendCodeMutation.mutateAsync({ phone: phoneValue, email: getValues('email') });
      setIsCodeSent(true);
      toast.success('인증번호가 발송되었습니다');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || '인증번호 발송에 실패했습니다');
    }
  };

  const handleVerifyCode = async () => {
    const phoneValue = getValues('phone');
    const codeValue = getValues('verifyCode');

    try {
      await verifyCodeMutation.mutateAsync({ phone: phoneValue, code: codeValue });
      setIsCodeVerified(true);
      toast.success('인증이 완료되었습니다');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || '인증번호가 일치하지 않습니다');
    }
  };

  const onSubmit = async (data: RegisterForm) => {
    if (!isCodeVerified) {
      toast.error('휴대폰 인증을 완료해주세요');
      return;
    }

    try {
      await registerMutation.mutateAsync({
        email: data.email,
        password: data.password,
        userName: data.userName,
        phone: data.phone.replace(/-/g, ''),
      });
      toast.success('회원가입이 완료되었습니다!');
      navigate({ to: '/' });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || '회원가입에 실패했습니다');
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">회원가입</h1>
          <p className="mt-2 text-sm text-gray-600">GB Planner와 함께 학습을 시작하세요</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 이름 */}
          <div className="space-y-2">
            <Label htmlFor="userName">이름</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="userName"
                placeholder="이름을 입력하세요"
                className="pl-10"
                {...register('userName')}
              />
            </div>
            {errors.userName && <p className="text-sm text-red-500">{errors.userName.message}</p>}
          </div>

          {/* 이메일 */}
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="이메일을 입력하세요"
                className="pl-10"
                {...register('email')}
              />
            </div>
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>

          {/* 비밀번호 */}
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="password"
                type="password"
                placeholder="8자 이상, 영문+숫자"
                className="pl-10"
                {...register('password')}
              />
            </div>
            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
          </div>

          {/* 비밀번호 확인 */}
          <div className="space-y-2">
            <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="passwordConfirm"
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                className="pl-10"
                {...register('passwordConfirm')}
              />
            </div>
            {errors.passwordConfirm && (
              <p className="text-sm text-red-500">{errors.passwordConfirm.message}</p>
            )}
          </div>

          {/* 휴대폰 */}
          <div className="space-y-2">
            <Label htmlFor="phone">휴대폰 번호</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="phone"
                  placeholder="010-1234-5678"
                  className="pl-10"
                  disabled={isCodeVerified}
                  {...register('phone')}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleSendCode}
                disabled={sendCodeMutation.isPending || isCodeVerified || !phone}
              >
                {sendCodeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isCodeSent ? (
                  '재발송'
                ) : (
                  '인증요청'
                )}
              </Button>
            </div>
            {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
          </div>

          {/* 인증번호 */}
          {isCodeSent && (
            <div className="space-y-2">
              <Label htmlFor="verifyCode">인증번호</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="verifyCode"
                    placeholder="인증번호 6자리"
                    maxLength={6}
                    disabled={isCodeVerified}
                    {...register('verifyCode')}
                  />
                  {isCodeVerified && (
                    <CheckCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500" />
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleVerifyCode}
                  disabled={verifyCodeMutation.isPending || isCodeVerified}
                >
                  {verifyCodeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isCodeVerified ? (
                    '인증완료'
                  ) : (
                    '확인'
                  )}
                </Button>
              </div>
              {errors.verifyCode && (
                <p className="text-sm text-red-500">{errors.verifyCode.message}</p>
              )}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={registerMutation.isPending || !isCodeVerified}
          >
            {registerMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                가입 중...
              </>
            ) : (
              '회원가입'
            )}
          </Button>
        </form>

        {/* 하단 링크 */}
        <div className="mt-6 text-center text-sm">
          <p className="text-gray-600">
            이미 계정이 있으신가요?{' '}
            <Link to="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              로그인
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}




