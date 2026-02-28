import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProtectedRoute } from '@/components/auth';
import {
  useGetStoreCode,
  usePreRegisterPayment,
  useVerifyPayment,
  useValidateCoupon,
  useFreePayment,
} from '@/stores/server/payment';
import { useUser } from '@/stores/client/use-auth-store';
import { Loader2, CreditCard, Tag, Check } from 'lucide-react';

export const Route = createFileRoute('/order/$productId')({
  component: () => (
    <ProtectedRoute>
      <OrderPage />
    </ProtectedRoute>
  ),
});

// 임시 상품 정보 (실제로는 API에서 가져옴)
const getProduct = (id: string) => {
  const products: Record<string, { id: number; name: string; price: number; term: number }> = {
    '2': { id: 2, name: 'GB Planner Pro', price: 29900, term: 30 },
    '3': { id: 3, name: 'GB Planner Premium', price: 59900, term: 30 },
  };
  return products[id];
};

function OrderPage() {
  const navigate = useNavigate();
  const { productId } = useParams({ from: '/order/$productId' });
  const user = useUser();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountPrice: number;
  } | null>(null);

  const { data: storeCodeData } = useGetStoreCode();
  const preRegisterMutation = usePreRegisterPayment();
  const verifyMutation = useVerifyPayment();
  const validateCouponMutation = useValidateCoupon();
  const freePaymentMutation = useFreePayment();

  const product = getProduct(productId);

  if (!product) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <p className="text-gray-600">상품을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const finalPrice = appliedCoupon
    ? Math.max(0, product.price - appliedCoupon.discountPrice)
    : product.price;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('쿠폰 코드를 입력해주세요');
      return;
    }

    try {
      const result = await validateCouponMutation.mutateAsync({
        couponNumber: couponCode,
        productId: product.id,
      });
      setAppliedCoupon({ code: couponCode, discountPrice: result.discountPrice });
      toast.success(`₩${result.discountPrice.toLocaleString()} 할인이 적용되었습니다`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || '유효하지 않은 쿠폰입니다');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const handlePayment = async () => {
    // 무료 결제 (100% 할인)
    if (finalPrice === 0 && appliedCoupon) {
      try {
        await freePaymentMutation.mutateAsync({
          couponNumber: appliedCoupon.code,
          productId: product.id,
        });
        toast.success('결제가 완료되었습니다!');
        navigate({ to: '/' });
        return;
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(err.response?.data?.message || '결제에 실패했습니다');
        return;
      }
    }

    // 유료 결제
    if (!storeCodeData?.storeCode) {
      toast.error('결제 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    try {
      // 1. 사전 등록
      const preRegisterData = await preRegisterMutation.mutateAsync({
        productId: product.id,
        couponNumber: appliedCoupon?.code,
      });

      // 2. 아임포트 결제 호출
      const IMP = (window as unknown as { IMP?: { init: (code: string) => void; request_pay: (params: unknown, callback: (response: { success: boolean; imp_uid?: string; error_msg?: string }) => void) => void } }).IMP;
      if (!IMP) {
        toast.error('결제 모듈을 불러올 수 없습니다. 페이지를 새로고침해주세요.');
        return;
      }

      IMP.init(storeCodeData.storeCode);

      IMP.request_pay(
        {
          pg: 'html5_inicis',
          pay_method: 'card',
          merchant_uid: preRegisterData.merchantUid,
          name: product.name,
          amount: finalPrice,
          buyer_email: user?.email || '',
          buyer_name: user?.userName || '',
          buyer_tel: user?.phone || '',
        },
        async (response: { success: boolean; imp_uid?: string; error_msg?: string }) => {
          if (response.success && response.imp_uid) {
            // 3. 결제 검증
            try {
              await verifyMutation.mutateAsync({
                impUid: response.imp_uid,
                merchantUid: preRegisterData.merchantUid,
                couponNumber: appliedCoupon?.code,
              });
              toast.success('결제가 완료되었습니다!');
              navigate({ to: '/' });
            } catch (verifyError: unknown) {
              const err = verifyError as { response?: { data?: { message?: string } } };
              toast.error(err.response?.data?.message || '결제 검증에 실패했습니다');
            }
          } else {
            toast.error(response.error_msg || '결제가 취소되었습니다');
          }
        },
      );
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || '결제 준비에 실패했습니다');
    }
  };

  const isLoading =
    preRegisterMutation.isPending || verifyMutation.isPending || freePaymentMutation.isPending;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">결제하기</h1>

      <div className="space-y-6">
        {/* 상품 정보 */}
        <Card className="p-6">
          <h2 className="mb-4 font-semibold text-gray-900">주문 상품</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{product.name}</p>
              <p className="text-sm text-gray-500">{product.term}일 이용권</p>
            </div>
            <p className="text-lg font-bold text-gray-900">₩{product.price.toLocaleString()}</p>
          </div>
        </Card>

        {/* 쿠폰 적용 */}
        <Card className="p-6">
          <h2 className="mb-4 font-semibold text-gray-900">쿠폰 적용</h2>
          {appliedCoupon ? (
            <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">
                  {appliedCoupon.code} (-₩{appliedCoupon.discountPrice.toLocaleString()})
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleRemoveCoupon}>
                제거
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="쿠폰 코드를 입력하세요"
                  className="pl-10"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                onClick={handleApplyCoupon}
                disabled={validateCouponMutation.isPending}
              >
                {validateCouponMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  '적용'
                )}
              </Button>
            </div>
          )}
        </Card>

        {/* 결제 금액 */}
        <Card className="p-6">
          <h2 className="mb-4 font-semibold text-gray-900">결제 금액</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">상품 금액</span>
              <span>₩{product.price.toLocaleString()}</span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-sm text-green-600">
                <span>쿠폰 할인</span>
                <span>-₩{appliedCoupon.discountPrice.toLocaleString()}</span>
              </div>
            )}
            <div className="border-t pt-2">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">총 결제 금액</span>
                <span className="text-xl font-bold text-indigo-600">
                  ₩{finalPrice.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* 결제 버튼 */}
        <Button className="w-full py-6 text-lg" onClick={handlePayment} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              결제 처리 중...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-5 w-5" />
              {finalPrice === 0 ? '무료로 시작하기' : `₩${finalPrice.toLocaleString()} 결제하기`}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}




