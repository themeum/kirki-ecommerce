import type { CSSObject } from '@emotion/react';

import ToastCloseButton from '@/components/ui/toast/toast-close-button';
import { getToastDuration } from '@/components/ui/toast/toast-duration';
import ToastIcon from '@/components/ui/toast/toast-icon';
import type { ToastState } from '@/components/ui/toast/toast-types';
import { useToastCountdown } from '@/components/ui/toast/use-toast-countdown';
import { theme } from '@/theme';
import { defineStyles, scoped, uiFocusRing } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type ToastCardProps = {
  toast: ToastState;
  onClose: () => void;
  onExpire: () => void;
  onUndo: () => void;
  onRetry: () => void;
};

const lineClamp = (lines: number): CSSObject => {
  return {
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    overflowWrap: 'anywhere',
  };
};

const ToastCard = ({ toast, onClose, onExpire, onUndo, onRetry }: ToastCardProps) => {
  const durationMs = getToastDuration({
    variant: toast.variant,
    title: toast.title,
    description: toast.description,
    duration: toast.duration,
    loading: toast.loading,
    hasUndo: Boolean(toast.undo),
  });
  const ringRef = useToastCountdown({ durationMs, revision: toast.revision, onExpire });
  const showActions = !toast.loading;

  return (
    <div
      role={toast.variant === 'error' ? 'alert' : 'status'}
      data-toast-variant={toast.variant}
      css={scoped(styles.card)}
    >
      <div css={scoped(styles.surface)}>
        <ToastIcon variant={toast.variant} loading={toast.loading} />
        <div css={scoped(styles.message)}>
          <div css={scoped(styles.title)}>{toast.title}</div>
          {toast.description && <div css={scoped(styles.description)}>{toast.description}</div>}
        </div>
        {showActions && (
          <div css={scoped(styles.trail)}>
            {toast.undo && (
              <button type="button" onClick={onUndo} css={scoped(styles.action)}>
                {toast.undo.label ?? __('Undo', 'kirki-ecommerce')}
              </button>
            )}
            {toast.retry && (
              <button type="button" onClick={onRetry} css={scoped(styles.action)}>
                {toast.retry.label ?? __('Retry', 'kirki-ecommerce')}
              </button>
            )}
            <ToastCloseButton
              onClose={onClose}
              variant={toast.variant}
              showRing={durationMs !== null}
              ringRef={ringRef}
            />
          </div>
        )}
      </div>
    </div>
  );
};

ToastCard.displayName = 'ToastCard';

export default ToastCard;

const styles = defineStyles({
  card: {
    width: 'var(--width)',
    maxWidth: '100%',
    marginInline: 'auto',
    boxSizing: 'border-box',
    padding: theme.spacing[1],
    borderRadius: theme.radius.xxl,
    backgroundColor: theme.colors.background.surface,
    boxShadow: theme.shadow.toast,
    fontFamily: theme.typography.fontFamily,
  },
  surface: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing[2],
    padding: theme.spacing[2],
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.background.solidSurfaceAlt,
  },
  message: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    minWidth: 0,
  },
  title: {
    ...theme.typography.small('medium'),
    ...lineClamp(2),
    margin: 0,
    color: theme.colors.text.primary,
  },
  description: {
    ...theme.typography.tiny(),
    ...lineClamp(3),
    margin: 0,
    color: theme.colors.text.subdued,
  },
  trail: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    gap: theme.spacing[1],
  },
  action: {
    ...theme.typography.tiny('medium'),
    height: theme.spacing[8],
    padding: `0 ${theme.spacing[3]}`,
    border: 0,
    borderRadius: theme.radius.lg,
    backgroundColor: 'transparent',
    color: theme.colors.text.primary,
    cursor: 'pointer',
    transition: 'background-color 150ms ease',
    '&:hover': {
      backgroundColor: theme.colors.background.fillHover,
    },
    '&:focus-visible': {
      ...uiFocusRing(theme),
    },
  },
});
