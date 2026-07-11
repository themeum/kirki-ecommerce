import type { CSSProperties } from 'react';

import { CLASS_PREFIX } from '@/conf';

type BoxGeneratorProps = {
  length: number;
  height: number;
  width: number;
  unit: string;
};

export const BoxGenerator = ({
  length,
  height,
  width,
  unit,
}: BoxGeneratorProps) => {
  const UNIT_TO_VISUAL: Record<string, number> = { cm: 1, in: 2.54 };
  const PREVIEW = { width: 220, height: 140, depth: 220 };
  const PADDING = 0.9;

  const toVisual = (value: number) => value * (UNIT_TO_VISUAL[unit] ?? 1);

  const lengthV = toVisual(length);
  const widthV = toVisual(width);
  const heightV = toVisual(height);

  const scaleX = PREVIEW.width / widthV;
  const scaleY = PREVIEW.height / heightV;
  const scaleZ = PREVIEW.depth / lengthV;

  const scale = Math.min(scaleX, scaleY, scaleZ, 1) * PADDING;

  const widthF = widthV * scale;
  const heightF = heightV * scale;
  const lengthF = lengthV * scale;

  return (
    <div
      className={`${CLASS_PREFIX}-box-container`}
      style={{ perspective: Math.max(600, lengthF * 3) }}
    >
      <div
        className={`${CLASS_PREFIX}-box`}
        style={
          {
            '--w': `${widthF}px`,
            '--h': `${heightF}px`,
            '--l': `${lengthF}px`,
            transform: 'rotateX(-20deg) rotateY(30deg)',
          } as CSSProperties
        }
      >
        <div className="face front" />
        <div className="face back" />
        <div className="face left" />
        <div className="face right" />
        <div className="face top" />
        <div className="face bottom" />
      </div>
    </div>
  );
};
