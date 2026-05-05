/**
 * SNS 공유 유틸리티 — 카카오톡 + 범용 공유
 *
 * 카카오톡 SDK 없이도 동작하는 범용 공유 + 카카오톡 링크 공유
 */

// ═══════════════════════════════════════════
// 카카오톡 공유 (Kakao SDK)
// ═══════════════════════════════════════════

declare global {
  interface Window {
    Kakao?: any;
  }
}

interface KakaoShareOptions {
  title: string;
  description: string;
  imageUrl?: string;
  /** 공유 링크 (게임/초대 등) */
  link: string;
  /** 버튼 텍스트 */
  buttonText?: string;
}

/**
 * 카카오톡 SDK 초기화 (한 번만)
 */
export function initKakaoSDK(appKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Kakao?.isInitialized?.()) {
      resolve();
      return;
    }

    // 이미 로드된 경우
    if (window.Kakao) {
      window.Kakao.init(appKey);
      resolve();
      return;
    }

    // SDK 동적 로드
    const script = document.createElement('script');
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
    script.integrity = 'sha384-TiCUE00h649CAMonG018J2ujOgDKW/kVWlChEuu4jK2vxfAAD0eZxzCKakxg55G4';
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      if (window.Kakao) {
        window.Kakao.init(appKey);
        resolve();
      } else {
        reject(new Error('Kakao SDK load failed'));
      }
    };
    script.onerror = () => reject(new Error('Kakao SDK script load failed'));
    document.head.appendChild(script);
  });
}

/**
 * 카카오톡 링크 공유
 */
export async function shareViaKakao(options: KakaoShareOptions): Promise<boolean> {
  try {
    if (!window.Kakao?.isInitialized?.()) {
      console.warn('Kakao SDK not initialized');
      return false;
    }

    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: options.title,
        description: options.description,
        imageUrl: options.imageUrl || 'https://geobukschool.kr/og-image.png',
        link: {
          mobileWebUrl: options.link,
          webUrl: options.link,
        },
      },
      buttons: [
        {
          title: options.buttonText || '자세히 보기',
          link: {
            mobileWebUrl: options.link,
            webUrl: options.link,
          },
        },
      ],
    });
    return true;
  } catch (error) {
    console.error('Kakao share failed:', error);
    return false;
  }
}

// ═══════════════════════════════════════════
// 범용 공유 (Web Share API / Clipboard)
// ═══════════════════════════════════════════

interface GeneralShareOptions {
  title: string;
  text: string;
  url?: string;
  files?: File[];
}

/**
 * 네이티브 공유 (모바일) 또는 클립보드 복사 (데스크톱)
 */
export async function shareGeneral(
  options: GeneralShareOptions,
): Promise<'shared' | 'copied' | 'cancelled'> {
  // Web Share API 지원 확인
  if (navigator.share) {
    try {
      const shareData: ShareData = {
        title: options.title,
        text: options.text,
        url: options.url,
      };

      // 파일 공유 가능 여부 확인
      if (options.files && navigator.canShare && navigator.canShare({ files: options.files })) {
        shareData.files = options.files;
      }

      await navigator.share(shareData);
      return 'shared';
    } catch (err: any) {
      if (err?.name === 'AbortError') return 'cancelled';
      // 실패 시 클립보드 폴백
    }
  }

  // 클립보드 폴백
  const clipboardText = `${options.title}\n\n${options.text}${options.url ? `\n\n${options.url}` : ''}`;
  await navigator.clipboard.writeText(clipboardText);
  return 'copied';
}

// ═══════════════════════════════════════════
// 공유 템플릿 생성
// ═══════════════════════════════════════════

const BASE_URL = 'https://geobukschool.kr';

/** 마이 클래스 초대 공유 */
export function buildClassInviteShare(roomName: string, roomCode: string) {
  return {
    title: `🏠 "${roomName}" 마이 클래스 초대!`,
    description: `같이 공부하면서 경쟁하자! 🔥\n초대 코드: ${roomCode}`,
    text: `🏠 "${roomName}" 마이 클래스에서 같이 공부하자!\n\n초대 코드: ${roomCode}\n\n🌱 StudyPlanner by 거북스쿨`,
    link: `${BASE_URL}/join/${roomCode}`,
    buttonText: '지금 참여하기',
  };
}

/** Streak 자랑 공유 */
export function buildStreakShare(streak: number, userName?: string) {
  return {
    title: `🔥 ${streak}일 연속 학습 달성!`,
    description: `${userName || '나'}의 연속 학습 기록을 확인해보세요!`,
    text: `🔥 ${streak}일 연속 학습 달성!\n\n${userName ? `${userName}님이 ` : ''}스터디플래너에서 ${streak}일 연속으로 학습했어요!\n\n🌱 StudyPlanner by 거북스쿨`,
    link: `${BASE_URL}`,
    buttonText: '나도 시작하기',
  };
}

/** 뱃지 자랑 공유 */
export function buildBadgeShare(badgeName: string, badgeEmoji: string, userName?: string) {
  return {
    title: `${badgeEmoji} "${badgeName}" 뱃지 획득!`,
    description: `${userName || '나'}의 새로운 뱃지를 확인해보세요!`,
    text: `${badgeEmoji} "${badgeName}" 뱃지를 획득했어요!\n\n${userName ? `${userName}님이 ` : ''}스터디플래너에서 멋진 성과를 달성했어요!\n\n🌱 StudyPlanner by 거북스쿨`,
    link: `${BASE_URL}`,
    buttonText: '나도 도전하기',
  };
}
