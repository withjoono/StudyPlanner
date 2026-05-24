/**
 * 플로팅 거북 버튼 — 온보딩 투어를 다시 실행하는 상시 진입점.
 * 화면 오른쪽 아래에 떠 있으며, 투어가 열려 있을 땐 숨는다.
 */
import { motion } from 'framer-motion';
import { useOnboardingStore } from '@/stores/client/use-onboarding-store';
import { TurtleMascot } from './TurtleMascot';

export function OnboardingLauncher() {
  const isTourOpen = useOnboardingStore((s) => s.isTourOpen);
  const startTour = useOnboardingStore((s) => s.startTour);

  if (isTourOpen) return null;

  return (
    <motion.button
      type="button"
      onClick={startTour}
      title="사용법 다시 보기"
      aria-label="사용법 다시 보기"
      className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-indigo-100 bg-white shadow-lg shadow-indigo-200/60 md:bottom-6 md:right-6"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <motion.span
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <TurtleMascot mood="happy" size={42} />
      </motion.span>
    </motion.button>
  );
}
