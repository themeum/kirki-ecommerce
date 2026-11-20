import { keyframes } from '@emotion/react';

import { toastVariantColor } from '@/components/ui/toast/toast-colors';
import type { ToastVariant } from '@/components/ui/toast/toast-types';
import { theme } from '@/theme';
import { defineStyles, scoped, scopedMerge } from '@/theme/mixins';

type ToastIconProps = {
  variant: ToastVariant;
  loading?: boolean;
};

const ToastGlyph = ({ variant }: { variant: ToastVariant }) => {
  if (variant === 'success') {
    return (
      <>
        <circle css={scoped(styles.fill)} cx="12" cy="12" r="10" />
        <path css={scoped(styles.mark)} d="m8.25 12.25 2.5 2.5 5-5" />
      </>
    );
  }

  if (variant === 'info') {
    return (
      <>
        <circle css={scoped(styles.fill)} cx="12" cy="12" r="10" />
        <path css={scoped(styles.mark)} d="M12 16.25v-4.75" />
        <path css={scoped(styles.dot)} d="M12 8h.01" />
      </>
    );
  }

  if (variant === 'warning') {
    return (
      <>
        <path
          css={scoped(styles.fill)}
          d="M10.27 3.5 1.9 18a2 2 0 0 0 1.73 3h16.74a2 2 0 0 0 1.73-3L13.73 3.5a2 2 0 0 0-3.46 0z"
        />
        <path css={scoped(styles.mark)} d="M12 9v4.25" />
        <path css={scoped(styles.dot)} d="M12 17h.01" />
      </>
    );
  }

  return (
    <>
      <circle css={scoped(styles.fill)} cx="12" cy="12" r="10" />
      <path css={scoped(styles.mark)} d="M12 7.5v5" />
      <path css={scoped(styles.dot)} d="M12 16.25h.01" />
    </>
  );
};

const ToastIcon = ({ variant, loading = false }: ToastIconProps) => {
  return (
    <span
      aria-hidden="true"
      data-toast-icon={loading ? 'loading' : variant}
      css={scopedMerge(styles.root, styles.variants[variant])}
    >
      <span css={scopedMerge(styles.badge, styles.badgeVariants[variant])}>
        <svg viewBox="0 0 24 24" css={scoped(styles.glyph)}>
          {loading ? (
            <path css={scoped(styles.spinner)} d="M21 12a9 9 0 1 1-6.2-8.56" />
          ) : (
            <ToastGlyph variant={variant} />
          )}
        </svg>
      </span>
    </span>
  );
};

ToastIcon.displayName = 'ToastIcon';

export default ToastIcon;

const spin = keyframes({
  to: {
    transform: 'rotate(360deg)',
  },
});

const pulse = keyframes({
  '50%': {
    opacity: 0.35,
  },
});

const styles = defineStyles({
  root: {
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
    width: '36px',
    height: '36px',
  },
  variants: {
    success: { color: toastVariantColor.success },
    info: { color: toastVariantColor.info },
    warning: { color: toastVariantColor.warning },
    error: { color: toastVariantColor.error },
  },
  badge: {
    display: 'grid',
    placeItems: 'center',
    width: '31.5px',
    height: '31.5px',
    borderRadius: theme.radius.full,
  },
  badgeVariants: {
    success: { backgroundColor: theme.colors.background.fillSuccessSecondary },
    info: { backgroundColor: theme.colors.background.fillSecondary },
    warning: { backgroundColor: theme.colors.background.fillWarningSecondary },
    error: { backgroundColor: theme.colors.background.fillCriticalSecondary },
  },
  glyph: {
    display: 'block',
    width: '22.5px',
    height: '22.5px',
  },
  fill: {
    fill: 'currentColor',
  },
  mark: {
    fill: 'none',
    stroke: theme.colors.icon.inverse,
    strokeWidth: 1.75,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  },
  dot: {
    fill: 'none',
    stroke: theme.colors.icon.inverse,
    strokeWidth: 2.25,
    strokeLinecap: 'round',
  },
  spinner: {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.25,
    strokeLinecap: 'round',
    transformOrigin: '12px 12px',
    animation: `${spin} 1s linear infinite`,
    '@media (prefers-reduced-motion: reduce)': {
      animation: `${pulse} 1.2s ease-in-out infinite`,
    },
  },
});
