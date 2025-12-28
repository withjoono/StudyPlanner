/**
 * 결제 관련 타입 정의
 */

// 상품 정보
export interface Product {
  id: number;
  productNm: string;
  productPrice: number;
  term: number; // 이용 기간 (일)
  description?: string;
}

// 결제 내역
export interface PaymentHistory {
  id: number;
  paidAmount: number;
  cancelAmount?: number;
  cardName?: string;
  cardNumber?: string;
  orderState: 'PENDING' | 'COMPLETE' | 'CANCEL' | 'FAILED';
  createDt: string;
  updateDt: string;
  payService: {
    productNm: string;
    term: number;
    productPrice: number;
  };
}

// 결제 사전 등록 요청
export interface PreRegisterRequest {
  productId: number;
  couponNumber?: string;
}

// 결제 사전 등록 응답
export interface PreRegisterResponse {
  id: number;
  merchantUid: string;
  paidAmount: number;
}

// 결제 검증 요청
export interface VerifyPaymentRequest {
  impUid: string;
  merchantUid: string;
  couponNumber?: string;
}

// 결제 검증 응답
export interface VerifyPaymentResponse {
  impUid: string;
  activeServices: string[];
}

// 쿠폰 검증 요청
export interface ValidateCouponRequest {
  couponNumber: string;
  productId: number;
}

// 쿠폰 검증 응답
export interface ValidateCouponResponse {
  discountPrice: number;
  discountValue: number;
  discountType: 'PERCENT' | 'FIXED';
}

// 무료 결제 요청
export interface FreePaymentRequest {
  couponNumber: string;
  productId: number;
}

// 스토어 코드 응답
export interface StoreCodeResponse {
  storeCode: string;
}




