import type { CSSProperties } from 'react';

import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';

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
      css={styles.container}
      style={{ perspective: Math.max(600, lengthF * 3) }}
    >
      <div
        css={styles.box}
        style={
          {
            '--w': `${widthF}px`,
            '--h': `${heightF}px`,
            '--l': `${lengthF}px`,
            transform: 'rotateX(-20deg) rotateY(30deg)',
          } as CSSProperties
        }
      >
        <div css={[styles.face, styles.front]} />
        <div css={[styles.face, styles.back]} />
        <div css={[styles.face, styles.left]} />
        <div css={[styles.face, styles.right]} />
        <div css={[styles.face, styles.top]} />
        <div css={[styles.face, styles.bottom]} />
      </div>
    </div>
  );
};

const styles = {
  container: scoped({
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  }),
  box: scoped({
    position: 'relative',
    transformStyle: 'preserve-3d',
    margin: 'auto',
    width: 'var(--w)',
    height: 'var(--h)',
  }),
  face: scoped({
    position: 'absolute',
    top: '50%',
    left: '50%',
    transformStyle: 'preserve-3d',
    boxSizing: 'border-box',
  }),
  front: scoped({
    width: 'var(--w)',
    height: 'var(--h)',
    transform: 'translate(-50%, -50%) translateZ(calc(var(--l) / 2))',
    background: theme.colors.shipping.boxDark,
  }),
  back: scoped({
    width: 'var(--w)',
    height: 'var(--h)',
    transform:
      'translate(-50%, -50%) rotateY(180deg) translateZ(calc(var(--l) / 2))',
    background: theme.colors.shipping.boxDark,
  }),
  right: scoped({
    width: 'var(--l)',
    height: 'var(--h)',
    transform:
      'translate(-50%, -50%) rotateY(90deg) translateZ(calc(var(--w) / 2))',
    background: theme.colors.shipping.boxMid,
  }),
  left: scoped({
    width: 'var(--l)',
    height: 'var(--h)',
    transform:
      'translate(-50%, -50%) rotateY(-90deg) translateZ(calc(var(--w) / 2))',
    background: theme.colors.shipping.boxMid,
  }),
  top: scoped({
    width: 'var(--w)',
    height: 'var(--l)',
    transform:
      'translate(-50%, -50%) rotateX(90deg) translateZ(calc(var(--h) / 2))',
    background: theme.colors.shipping.boxLight,
  }),
  bottom: scoped({
    width: 'var(--w)',
    height: 'var(--l)',
    transform:
      'translate(-50%, -50%) rotateX(-90deg) translateZ(calc(var(--h) / 2))',
    background: theme.colors.shipping.boxLight,
  }),
};
