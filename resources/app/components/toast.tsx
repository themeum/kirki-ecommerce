import { keyframes } from '@emotion/react';
import type { ReactNode } from 'react';

import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import Button from '@/components/ui/button';
import { InfoIcon, AlertIcon, CloseIcon, CheckedIcon } from '@/icons';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
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
    default: { icon: <InfoIcon />, bg: '#F4F4F5' },
    success: {
      icon: <CheckedIcon />,
      bg: '#E3FFED',
      iconColor: '#1C7330',
      textColor: '#1C7330',
    },
    warning: {
      icon: <AlertIcon />,
      bg: '#FFF4E5',
      iconColor: '#E89100',
      textColor: '#854A0E',
    },
    delete: {
      icon: <CloseIcon style={{ width: '24px', height: '24px' }} />,
      bg: '#FFE5E4',
      iconColor: '#D40000',
      textColor: '#D40000',
    },
    error: {
      icon: <CloseIcon style={{ width: '24px', height: '24px' }} />,
      bg: '#FFE5E4',
      iconColor: '#D40000',
      textColor: '#D40000',
    },
  };

  const ui = VARIANT_UI[variant] || VARIANT_UI.default;

  return (
    <Flex direction={'column'}>
      <Flex
        gap={20}
        css={styles.element}
        style={{
          background: ui.bg,
        }}
      >
        <Flex gap={8}>
          <span
            css={styles.icon}
            style={{
              background: ui.iconColor,
            }}
          >
            {ui.icon}
          </span>
          <Text
            type="secondary"
            header={title}
            style={{
              color: ui.textColor,
            }}
          />
        </Flex>
        <Flex style={{ alignItems: 'center' }}>
          {undoAction && (
            <Button
              variant="ghost"
              size="sm"
              css={styles.undoButton}
              onClick={() => {
                onUndo?.();
              }}
            >
              {__('Undo', 'kirki-ecommerce')}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            aria-label={__('Close', 'kirki-ecommerce')}
            css={styles.closeButton}
            onClick={onClose}
          >
            <CloseIcon />
          </Button>
        </Flex>
      </Flex>
      {variant === 'delete' && (
        <div css={styles.timer}>
          <div
            css={styles.timerBar}
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
  container: scoped({
    position: 'fixed',
    bottom: '30px',
    right: '-8%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[2],
    zIndex: 9999,
  }),
  element: scoped({
    minWidth: '330px',
    maxWidth: 'auto',
    height: '68px',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
    borderRadius: `${theme.radius.xl} ${theme.radius.xl} ${theme.radius.sm} ${theme.radius.sm}`,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    animation: `${toastSlideIn} 0.2s ease-out`,
  }),
  icon: scoped({
    height: '30px',
    width: '30px',
    borderRadius: theme.radius.full,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#F3F3F7',
  }),
  timer: scoped({
    height: '3px',
    width: '100%',
    background: 'rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    borderRadius: theme.radius.sm,
  }),
  timerBar: scoped({
    height: '100%',
    width: '100%',
    transformOrigin: 'left',
    animationName: shrink,
    animationTimingFunction: 'linear',
    animationFillMode: 'forwards',
  }),
  undoButton: scoped({
    padding: theme.spacing[2],
  }),
  closeButton: scoped({
    pointerEvents: 'auto',
    padding: theme.spacing[1],
  }),
};
