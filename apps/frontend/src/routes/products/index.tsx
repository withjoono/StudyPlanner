import { createFileRoute, Link, useSearch } from '@tanstack/react-router';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Star } from 'lucide-react';
import { useIsAuthenticated } from '@/stores/client/use-auth-store';

export const Route = createFileRoute('/products/')({
  component: ProductsPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      required: search.required as string | undefined,
    };
  },
});

// 플래너 상품 목록 (실제로는 API에서 가져옴)
const products = [
  {
    id: 1,
    name: 'GB Planner Basic',
    description: '기본 플래너 기능',
    price: 0,
    originalPrice: 0,
    term: 0, // 무료
    features: ['일일 미션 관리', '주간 루틴 설정', '기본 통계'],
    recommended: false,
  },
  {
    id: 2,
    name: 'GB Planner Pro',
    description: '프로 플래너 기능 + 멘토링',
    price: 29900,
    originalPrice: 39900,
    term: 30,
    features: [
      '모든 Basic 기능',
      '장기 학습 계획',
      '교재 DB 연동',
      '자동 일정 분배',
      '상세 분석 리포트',
    ],
    recommended: true,
  },
  {
    id: 3,
    name: 'GB Planner Premium',
    description: '프리미엄 기능 + 1:1 멘토링',
    price: 59900,
    originalPrice: 79900,
    term: 30,
    features: [
      '모든 Pro 기능',
      '1:1 멘토링 연결',
      '맞춤 학습 피드백',
      '우선 고객 지원',
      'AI 학습 추천',
    ],
    recommended: false,
  },
];

function ProductsPage() {
  const { required } = useSearch({ from: '/products/' });
  const isAuthenticated = useIsAuthenticated();

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold text-gray-900">GB Planner 요금제</h1>
        <p className="mt-2 text-gray-600">나에게 맞는 플랜을 선택하세요</p>
        {required && (
          <div className="mt-4 rounded-lg bg-amber-50 p-4 text-amber-800">
            <p>
              <strong>{required}</strong> 서비스를 이용하려면 요금제 구매가 필요합니다.
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {products.map((product) => (
          <Card
            key={product.id}
            className={`relative flex flex-col p-6 ${
              product.recommended
                ? 'border-2 border-indigo-600 shadow-lg'
                : 'border border-gray-200'
            }`}
          >
            {product.recommended && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-sm font-medium text-white">
                  <Star className="h-3 w-3" />
                  추천
                </span>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
              <p className="mt-1 text-sm text-gray-600">{product.description}</p>
            </div>

            <div className="mb-6">
              {product.price === 0 ? (
                <div className="text-3xl font-bold text-gray-900">무료</div>
              ) : (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">
                      ₩{product.price.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500">/ {product.term}일</span>
                  </div>
                  {product.originalPrice > product.price && (
                    <div className="text-sm text-gray-400 line-through">
                      ₩{product.originalPrice.toLocaleString()}
                    </div>
                  )}
                </>
              )}
            </div>

            <ul className="mb-8 flex-1 space-y-3">
              {product.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                  <span className="text-sm text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>

            {isAuthenticated ? (
              product.price === 0 ? (
                <Button variant="outline" className="w-full" disabled>
                  현재 사용 중
                </Button>
              ) : (
                <Link to={`/order/${product.id}`}>
                  <Button
                    className={`w-full ${
                      product.recommended
                        ? 'bg-indigo-600 hover:bg-indigo-700'
                        : ''
                    }`}
                    variant={product.recommended ? 'default' : 'outline'}
                  >
                    구매하기
                  </Button>
                </Link>
              )
            ) : (
              <Link to="/auth/login" search={{ redirect: `/order/${product.id}` }}>
                <Button className="w-full" variant={product.recommended ? 'default' : 'outline'}>
                  로그인 후 구매
                </Button>
              </Link>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}




