import type { ReactNode } from 'react';

import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import Button from '@/components/ui/button';
import { InfoIcon, AlertIcon, CloseIcon, CheckedIcon } from '@/icons';
import { CLASS_PREFIX } from '@/conf';
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
        className={`${CLASS_PREFIX}-toast-element`}
        style={{
          background: ui.bg,
        }}
      >
        <Flex gap={8}>
          <span
            className={`${CLASS_PREFIX}-toast-icon`}
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
              style={{ padding: '6px' }}
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
            style={{ pointerEvents: 'auto', padding: '2px' }}
            onClick={onClose}
          >
            <CloseIcon />
          </Button>
        </Flex>
      </Flex>
      {variant === 'delete' && (
        <div className={`${CLASS_PREFIX}-toast-timer`}>
          <div
            className={`${CLASS_PREFIX}-toast-timer-bar`}
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
