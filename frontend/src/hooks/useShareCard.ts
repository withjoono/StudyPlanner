/**
 * useShareCard — 공유 카드 이미지 생성 + Web Share API + 도토리 획득
 *
 * 1. DOM → Canvas → Blob 변환 (html2canvas)
 * 2. Web Share API로 네이티브 공유 (모바일)
 * 3. 폴백: 이미지 다운로드
 * 4. 공유 완료 시 도토리 earn API 호출
 */

import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useEarnAcorn } from '@/stores/server/acorn';

export interface ShareCardOptions {
  /** 공유 제목 */
  title: string;
  /** 공유 텍스트 */
  text: string;
  /** 카드를 렌더링하는 DOM ref */
  cardRef: React.RefObject<HTMLDivElement>;
}

export function useShareCard() {
  const earnAcorn = useEarnAcorn();
  const isSharing = useRef(false);

  const share = useCallback(
    async (options: ShareCardOptions) => {
      if (isSharing.current) return;
      isSharing.current = true;

      try {
        const cardEl = options.cardRef.current;
        if (!cardEl) {
          toast.error('공유 카드를 생성할 수 없습니다.');
          return;
        }

        // Dynamic import html2canvas (lazy load)
        const html2canvasModule = await import('html2canvas');
        const html2canvas = html2canvasModule.default;

        const canvas = await html2canvas(cardEl, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: false,
        });

        // Canvas → Blob
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/png', 0.95),
        );

        if (!blob) {
          toast.error('이미지 생성에 실패했습니다.');
          return;
        }

        const file = new File([blob], 'study-card.png', { type: 'image/png' });

        // Web Share API 지원 확인
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: options.title,
              text: `${options.text}\n\n🌱 StudyPlanner by 거북스쿨\nhttps://geobukschool.kr`,
              files: [file],
            });

            // 공유 완료 → 도토리 획득
            const result = await earnAcorn.mutateAsync({ type: 'sns_share' });
            if (result.success) {
              toast.success(
                `공유 완료! 🌰 +${result.amount} 도토리 획득! (잔액: ${result.newBalance})`,
                {
                  duration: 3000,
                },
              );
            } else {
              toast.success('공유 완료!');
              if (result.reason) {
                toast.info(result.reason, { duration: 2000 });
              }
            }
          } catch (err: any) {
            // 사용자가 공유 취소
            if (err?.name === 'AbortError') {
              return;
            }
            // 다른 에러면 폴백
            downloadImage(blob, 'study-card.png');
            toast.success('이미지가 다운로드되었습니다. SNS에 직접 공유해주세요!');
          }
        } else {
          // Web Share API 미지원 → 다운로드
          downloadImage(blob, 'study-card.png');

          // 다운로드도 공유 의도로 간주 → 도토리 지급
          const result = await earnAcorn.mutateAsync({ type: 'sns_share' });
          if (result.success) {
            toast.success(`이미지 저장 완료! 🌰 +${result.amount} 도토리! SNS에 공유해주세요!`, {
              duration: 3000,
            });
          } else {
            toast.success('이미지가 다운로드되었습니다.');
          }
        }
      } catch (error) {
        console.error('Share failed:', error);
        toast.error('공유 중 오류가 발생했습니다.');
      } finally {
        isSharing.current = false;
      }
    },
    [earnAcorn],
  );

  return { share, isSharing: earnAcorn.isPending };
}

function downloadImage(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
