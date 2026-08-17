import { type CSSObject, keyframes } from '@emotion/react';
import { type ComponentPropsWithoutRef, type CSSProperties, forwardRef } from 'react';

import { theme } from '@/theme';
import { defineStyles, scopedMerge } from '@/theme/mixins';

type SkeletonRadius = keyof typeof theme.radius;

type SkeletonProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'className' | 'css'
> & {
  width?: string | number;
  height?: string | number;
  radius?: SkeletonRadius;
  cssOverride?: CSSObject;
};

const toCssLength = (value: string | number) => {
  return typeof value === 'number' ? `${value}px` : value;
};

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>((props, ref) => {
  const { cssOverride, width, height, radius = 'md', style, ...rest } = props;

  const skeletonStyle = defineStyles({
    ...(width !== undefined ? { '--skeleton-width': toCssLength(width) } : {}),
    ...(height !== undefined ? { '--skeleton-height': toCssLength(height) } : {}),
    ...style,
  }) as CSSProperties;

  return (
    <div
      ref={ref}
      data-slot="skeleton"
      aria-hidden="true"
      style={skeletonStyle}
      css={scopedMerge(styles.root, styles.radii[radius], cssOverride)}
      {...rest}
    />
  );
});

Skeleton.displayName = 'Skeleton';

export default Skeleton;
export type { SkeletonProps, SkeletonRadius };

const skeletonPulse = keyframes({
  '0%, 100%': {
    opacity: 1,
  },
  '50%': {
    opacity: 0.5,
  },
});

const radiusStyles = defineStyles({
  none: { borderRadius: theme.radius.none },
  sm: { borderRadius: theme.radius.sm },
  md: { borderRadius: theme.radius.md },
  lg: { borderRadius: theme.radius.lg },
  xl: { borderRadius: theme.radius.xl },
  full: { borderRadius: theme.radius.full },
});

const styles = defineStyles({
  root: {
    flexShrink: 0,
    backgroundColor: theme.colors.background.surfaceTertiary,
    width: 'var(--skeleton-width, 100%)',
    height: 'var(--skeleton-height, 1rem)',
    animation: `${skeletonPulse} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
  },
  radii: radiusStyles,
});
