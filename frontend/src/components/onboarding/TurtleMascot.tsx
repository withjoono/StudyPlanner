/**
 * 거북 마스코트 — 온보딩 가이드 캐릭터.
 * 외부 이미지 에셋 없이 인라인 SVG로 렌더링한다. mood 로 표정·동작이 바뀐다.
 */
import { useId } from 'react';

export type TurtleMood = 'wave' | 'happy' | 'point' | 'cheer';

interface TurtleMascotProps {
  /** 표정·동작 */
  mood?: TurtleMood;
  /** 픽셀 크기 (정사각형 기준) */
  size?: number;
  className?: string;
}

export function TurtleMascot({ mood = 'happy', size = 120, className }: TurtleMascotProps) {
  const uid = useId().replace(/:/g, '');
  const shellId = `turtle-shell-${uid}`;
  const skinId = `turtle-skin-${uid}`;

  const rightArmUp = mood === 'wave' || mood === 'point' || mood === 'cheer';
  const leftArmUp = mood === 'cheer';
  const eyesClosed = mood === 'cheer';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 140 152"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="거북이 마스코트"
    >
      <defs>
        <linearGradient id={shellId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbbf4e" />
          <stop offset="1" stopColor="#e8941c" />
        </linearGradient>
        <linearGradient id={skinId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#86d6a6" />
          <stop offset="1" stopColor="#5bb888" />
        </linearGradient>
      </defs>

      {/* 뒷다리 */}
      <ellipse cx="44" cy="128" rx="15" ry="10" fill={`url(#${skinId})`} />
      <ellipse cx="96" cy="128" rx="15" ry="10" fill={`url(#${skinId})`} />

      {/* 팔 (내린 상태) */}
      {!leftArmUp && (
        <ellipse
          cx="32"
          cy="94"
          rx="12"
          ry="17"
          fill={`url(#${skinId})`}
          transform="rotate(20 32 94)"
        />
      )}
      {!rightArmUp && (
        <ellipse
          cx="108"
          cy="94"
          rx="12"
          ry="17"
          fill={`url(#${skinId})`}
          transform="rotate(-20 108 94)"
        />
      )}

      {/* 등껍질 */}
      <ellipse
        cx="70"
        cy="58"
        rx="48"
        ry="37"
        fill={`url(#${shellId})`}
        stroke="#d9850f"
        strokeWidth="3"
      />
      <polygon
        points="85,52 77.5,65 62.5,65 55,52 62.5,39 77.5,39"
        fill="#f6cd7e"
        stroke="#d9850f"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M85 52 L106 47 M77.5 39 L86 23 M62.5 39 L54 23 M55 52 L34 47 M62.5 65 L56 84 M77.5 65 L84 84"
        stroke="#d9850f"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <ellipse cx="52" cy="40" rx="12" ry="7" fill="#ffffff" opacity="0.32" />

      {/* 머리 */}
      <circle cx="70" cy="100" r="25" fill={`url(#${skinId})`} />

      {/* 볼 */}
      <ellipse cx="50" cy="106" rx="6" ry="4" fill="#ff9db0" opacity="0.8" />
      <ellipse cx="90" cy="106" rx="6" ry="4" fill="#ff9db0" opacity="0.8" />

      {/* 눈 */}
      {eyesClosed ? (
        <g stroke="#2b3a2f" strokeWidth="3.2" strokeLinecap="round" fill="none">
          <path d="M55 98 q6 -7 12 0" />
          <path d="M73 98 q6 -7 12 0" />
        </g>
      ) : (
        <g>
          <circle cx="61" cy="97" r="7.5" fill="#ffffff" />
          <circle cx="79" cy="97" r="7.5" fill="#ffffff" />
          <circle cx="62.5" cy="98" r="3.8" fill="#2b3a2f" />
          <circle cx="80.5" cy="98" r="3.8" fill="#2b3a2f" />
          <circle cx="64" cy="96" r="1.5" fill="#ffffff" />
          <circle cx="82" cy="96" r="1.5" fill="#ffffff" />
        </g>
      )}

      {/* 입 */}
      {mood === 'cheer' ? (
        <path
          d="M61 109 q9 11 18 0 q-9 6 -18 0 Z"
          fill="#e0556b"
          stroke="#2b3a2f"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M62 110 q8 7 16 0"
          stroke="#2b3a2f"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      )}

      {/* 팔 (든 상태) — 껍질 위에 렌더 */}
      {leftArmUp && (
        <g>
          <rect
            x="16"
            y="22"
            width="19"
            height="42"
            rx="9.5"
            fill={`url(#${skinId})`}
            transform="rotate(-20 25.5 43)"
          />
          <circle cx="20" cy="22" r="10" fill="#86d6a6" />
        </g>
      )}
      {rightArmUp && (
        <g>
          <rect
            x="105"
            y="22"
            width="19"
            height="42"
            rx="9.5"
            fill={`url(#${skinId})`}
            transform="rotate(20 114.5 43)"
          />
          <circle cx="120" cy="22" r="10" fill="#86d6a6" />
        </g>
      )}
    </svg>
  );
}
