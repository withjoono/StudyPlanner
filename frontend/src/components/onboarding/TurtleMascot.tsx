import turtleImg from '@/assets/turtle-mascot.png';

export type TurtleMood = 'wave' | 'happy' | 'point' | 'cheer';

interface TurtleMascotProps {
  mood?: TurtleMood;
  size?: number;
  className?: string;
}

export function TurtleMascot({ size = 120, className }: TurtleMascotProps) {
  return (
    <img
      src={turtleImg}
      alt="거북 선생님"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain' }}
      draggable={false}
    />
  );
}
