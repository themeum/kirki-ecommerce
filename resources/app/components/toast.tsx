import { keyframes, css, type CSSObject } from '@emotion/react';
import type { ReactNode } from 'react';

import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import Button from '@/components/ui/button';
import { InfoIcon, AlertIcon, CloseIcon, CheckedIcon } from '@/icons';
import { theme } from '@/theme';
import { scoped, mergeCss } from '@/theme/mixins';
import type { ToastVariant } from '@/types';
import { __ } from '@/wpi18n';

type ToastProps = {
  title: string;
  variant?: ToastVariant;
  duration?: number;
  undoAction?: () => void;
  onUndo?: () => void;
  onClose?: () => void;
};

type ToastUi = {
  icon: ReactNode;
  bg: string;
  iconColor?: string;
  textColor?: string;
};

const Toast = ({
  title,
  variant = 'default',
  duration,
  undoAction,
  onUndo,
  onClose,
}: ToastProps) => {
  const VARIANT_UI: Record<ToastVariant, ToastUi> = {
    default: {
      icon: <InfoIcon />,
      bg: theme.colors.background.surfaceTertiary,
    },
    success: {
      icon: <CheckedIcon />,
      bg: theme.colors.background.fillSuccessSecondary,
      iconColor: theme.colors.text.success,
      textColor: theme.colors.text.success,
    },
    warning: {
      icon: <AlertIcon />,
      bg: theme.colors.background.fillWarningSecondary,
      iconColor: theme.colors.text.warning,
      textColor: theme.colors.text.warning,
    },
    delete: {
      icon: <CloseIcon style={{ width: '24px', height: '24px' }} />,
      bg: theme.colors.background.fillCriticalSecondary,
      iconColor: theme.colors.text.critical,
      textColor: theme.colors.text.critical,
    },
    error: {
      icon: <CloseIcon style={{ width: '24px', height: '24px' }} />,
      bg: theme.colors.background.fillCriticalSecondary,
      iconColor: theme.colors.text.critical,
      textColor: theme.colors.text.critical,
    },
  };

  const ui = VARIANT_UI[variant] || VARIANT_UI.default;

  return (
    <Flex direction={'column'}>
      <Flex gap={5} cssOverride={mergeCss(styles.element, css({ background: ui.bg }))} >
        <Flex gap={2}>
          <span
            css={scoped(styles.icon)}
            style={{
              background: ui.iconColor,
            }}
          >
            {ui.icon}
          </span>
          <Text weight="medium" style={{
              color: ui.textColor,
            }}>{title}</Text>
        </Flex>
        <Flex align="center">
          {undoAction && (
            <Button
              variant="ghost"
              cssOverride={styles.undoButton}
              onClick={() => {
                onUndo?.();
              }}
            >
              {__('Undo', 'kirki-ecommerce')}
            </Button>
          )}
          <Button
            variant="ghost"
            aria-label={__('Close', 'kirki-ecommerce')}
            cssOverride={styles.closeButton}
            onClick={onClose}
          >
            <CloseIcon />
          </Button>
        </Flex>
      </Flex>
      {variant === 'delete' && (
        <div css={scoped(styles.timer)}>
          <div
            css={scoped(styles.timerBar)}
            style={{
              animationDuration: `${duration}ms`,
              background: ui.iconColor,
            }}
          />
        </div>
      )}
    </Flex>
  );
};

export default Toast;

const shrink = keyframes({
  from: {
    transform: 'scaleX(1)',
  },
  to: {
    transform: 'scaleX(0)',
  },
});

const toastSlideIn = keyframes({
  from: {
    opacity: 0,
    transform: 'translateY(-6px)',
  },
  to: {
    opacity: 1,
    transform: 'translateY(0)',
  },
});

const styles = {
  container: ({
    position: 'fixed',
    bottom: '30px',
    right: '-8%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[2],
    zIndex: 9999,
  } satisfies CSSObject),
  element: ({
    minWidth: '330px',
    maxWidth: 'auto',
    height: '68px',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
    borderRadius: `${theme.radius.xl} ${theme.radius.xl} ${theme.radius.sm} ${theme.radius.sm}`,
    boxShadow: theme.shadow.md,
    animation: `${toastSlideIn} 0.2s ease-out`,
  } satisfies CSSObject),
  icon: ({
    height: '30px',
    width: '30px',
    borderRadius: theme.radius.full,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.colors.background.surfaceTertiary,
  } satisfies CSSObject),
  timer: ({
    height: '3px',
    width: '100%',
    background: theme.colors.background.fillTertiary,
    overflow: 'hidden',
    borderRadius: theme.radius.sm,
  } satisfies CSSObject),
  timerBar: ({
    height: '100%',
    width: '100%',
    transformOrigin: 'left',
    animationName: shrink,
    animationTimingFunction: 'linear',
    animationFillMode: 'forwards',
  } satisfies CSSObject),
  undoButton: ({
    padding: theme.spacing[2],
  } satisfies CSSObject),
  closeButton: ({
    pointerEvents: 'auto',
    padding: theme.spacing[1],
  } satisfies CSSObject),
};
