import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useLoginWithEmail } from '@/stores/server/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Loader2, Mail, Lock } from 'lucide-react';

export const Route = createFileRoute('/auth/login')({
  component: LoginPage,
});

const loginSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginPage() {
  const navigate = useNavigate();
  const loginMutation = useLoginWithEmail();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await loginMutation.mutateAsync(data);
      toast.success('로그인 성공!');
      navigate({ to: '/' });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || '로그인에 실패했습니다');
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">로그인</h1>
          <p className="mt-2 text-sm text-gray-600">GB Planner에 로그인하세요</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                className="pl-10"
                {...register('password')}
              />
            </div>
            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                로그인 중...
              </>
            ) : (
              '로그인'
            )}
          </Button>
        </form>

        {/* 소셜 로그인 */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">또는</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => toast.info('네이버 로그인은 준비 중입니다')}
            >
              <img src="/naver-icon.png" alt="Naver" className="mr-2 h-5 w-5" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              네이버
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => toast.info('구글 로그인은 준비 중입니다')}
            >
              <img src="/google-icon.png" alt="Google" className="mr-2 h-5 w-5" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              구글
            </Button>
          </div>
        </div>

        {/* 하단 링크 */}
        <div className="mt-6 text-center text-sm">
          <p className="text-gray-600">
            계정이 없으신가요?{' '}
            <Link to="/auth/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              회원가입
            </Link>
          </p>
          <Link
            to="/auth/reset-password"
            className="mt-2 block text-gray-500 hover:text-gray-700"
          >
            비밀번호를 잊으셨나요?
          </Link>
        </div>
      </Card>
    </div>
  );
}




