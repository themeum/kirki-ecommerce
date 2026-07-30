import type { CSSObject } from '@emotion/react';
import type { CSSProperties } from 'react';

import { theme } from '@/theme';
import { scoped, scopedMerge } from '@/theme/mixins';

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
      css={scoped(styles.container)}
      style={{ perspective: Math.max(600, lengthF * 3) }}
    >
      <div
        css={scoped(styles.box)}
        style={
          {
            '--w': `${widthF}px`,
            '--h': `${heightF}px`,
            '--l': `${lengthF}px`,
            transform: 'rotateX(-20deg) rotateY(30deg)',
          } as CSSProperties
        }
      >
        <div css={scopedMerge(styles.face, styles.front)} />
        <div css={scopedMerge(styles.face, styles.back)} />
        <div css={scopedMerge(styles.face, styles.left)} />
        <div css={scopedMerge(styles.face, styles.right)} />
        <div css={scopedMerge(styles.face, styles.top)} />
        <div css={scopedMerge(styles.face, styles.bottom)} />
      </div>
    </div>
  );
};

const styles = {
  container: ({
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  } satisfies CSSObject),
  box: ({
    position: 'relative',
    transformStyle: 'preserve-3d',
    margin: 'auto',
    width: 'var(--w)',
    height: 'var(--h)',
  } satisfies CSSObject),
  face: ({
    position: 'absolute',
    top: '50%',
    left: '50%',
    transformStyle: 'preserve-3d',
    boxSizing: 'border-box',
  } satisfies CSSObject),
  front: ({
    width: 'var(--w)',
    height: 'var(--h)',
    transform: 'translate(-50%, -50%) translateZ(calc(var(--l) / 2))',
    background: theme.colors.shipping.boxDark,
  } satisfies CSSObject),
  back: ({
    width: 'var(--w)',
    height: 'var(--h)',
    transform:
      'translate(-50%, -50%) rotateY(180deg) translateZ(calc(var(--l) / 2))',
    background: theme.colors.shipping.boxDark,
  } satisfies CSSObject),
  right: ({
    width: 'var(--l)',
    height: 'var(--h)',
    transform:
      'translate(-50%, -50%) rotateY(90deg) translateZ(calc(var(--w) / 2))',
    background: theme.colors.shipping.boxMid,
  } satisfies CSSObject),
  left: ({
    width: 'var(--l)',
    height: 'var(--h)',
    transform:
      'translate(-50%, -50%) rotateY(-90deg) translateZ(calc(var(--w) / 2))',
    background: theme.colors.shipping.boxMid,
  } satisfies CSSObject),
  top: ({
    width: 'var(--w)',
    height: 'var(--l)',
    transform:
      'translate(-50%, -50%) rotateX(90deg) translateZ(calc(var(--h) / 2))',
    background: theme.colors.shipping.boxLight,
  } satisfies CSSObject),
  bottom: ({
    width: 'var(--w)',
    height: 'var(--l)',
    transform:
      'translate(-50%, -50%) rotateX(-90deg) translateZ(calc(var(--h) / 2))',
    background: theme.colors.shipping.boxLight,
  } satisfies CSSObject),
};
