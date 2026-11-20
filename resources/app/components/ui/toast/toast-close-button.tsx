import { X } from 'lucide-react';
import type { Ref } from 'react';

import { toastVariantColor } from '@/components/ui/toast/toast-colors';
import type { ToastVariant } from '@/components/ui/toast/toast-types';
import { RING_PATH_LENGTH } from '@/components/ui/toast/use-toast-countdown';
import { theme } from '@/theme';
import { defineStyles, scoped, scopedMerge, uiFocusRing } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type ToastCloseButtonProps = {
  onClose: () => void;
  variant: ToastVariant;
  showRing: boolean;
  ringRef: Ref<SVGCircleElement>;
};

const RING_RADIUS = 11.5;

const ToastCloseButton = ({ onClose, variant, showRing, ringRef }: ToastCloseButtonProps) => {
  return (
    <span css={scoped(styles.root)}>
      {showRing && (
        <svg viewBox="0 0 24 24" aria-hidden="true" data-toast-ring="" css={scoped(styles.ring)}>
          <circle cx="12" cy="12" r={RING_RADIUS} css={scoped(styles.track)} />
          <circle
            ref={ringRef}
            cx="12"
            cy="12"
            r={RING_RADIUS}
            pathLength={RING_PATH_LENGTH}
            strokeDasharray={RING_PATH_LENGTH}
            strokeDashoffset={0}
            css={scopedMerge(styles.progress, styles.variants[variant])}
          />
        </svg>
      )}
      <button
        type="button"
        aria-label={__('Close notification', 'kirki-ecommerce')}
        onClick={onClose}
        css={scoped(styles.button)}
      >
        <X aria-hidden="true" />
      </button>
    </span>
  );
};

ToastCloseButton.displayName = 'ToastCloseButton';

export default ToastCloseButton;

const styles = defineStyles({
  root: {
    position: 'relative',
    display: 'block',
    flexShrink: 0,
    width: '24px',
    height: '24px',
  },
  ring: {
    position: 'absolute',
    inset: 0,
    width: '24px',
    height: '24px',
    fill: 'none',
    strokeWidth: 1,
    pointerEvents: 'none',
    transform: 'rotate(-90deg)',
  },
  track: {
    stroke: theme.colors.border.default,
  },
  progress: {
    fill: 'none',
  },
  variants: {
    success: { stroke: toastVariantColor.success },
    info: { stroke: toastVariantColor.info },
    warning: { stroke: toastVariantColor.warning },
    error: { stroke: toastVariantColor.error },
  },
  button: {
    display: 'grid',
    placeItems: 'center',
    width: '24px',
    height: '24px',
    padding: 0,
    border: 0,
    borderRadius: theme.radius.full,
    backgroundColor: 'transparent',
    color: theme.colors.icon.secondary,
    cursor: 'pointer',
    transition: 'background-color 150ms ease',
    '&:hover': {
      backgroundColor: theme.colors.background.fillHover,
    },
    '&:focus-visible': {
      ...uiFocusRing(theme),
    },
    '& svg': {
      width: '16px',
      height: '16px',
      strokeWidth: 1.6,
    },
  },
});
