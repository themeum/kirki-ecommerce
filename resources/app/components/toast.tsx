import type { ReactNode } from 'react';

import Flex from '@/molecules/flex';
import Text from '@/molecules/text';
import Button from '@/molecules/button';
import { InfoIcon, AlertIcon, CloseIcon, CheckedIcon } from '@/icons';
import { CLASS_PREFIX } from '@/conf';
import { __ } from '@/wpi18n';

type ToastUiVariant = 'default' | 'warning' | 'delete' | 'success' | 'error';

type ToastProps = {
  title: string;
  variant?: ToastUiVariant;
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
  const VARIANT_UI: Record<ToastUiVariant, ToastUi> = {
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
              size="small"
              text={__('Undo', 'kirki-ecommerce')}
              style={{ padding: '6px' }}
              onClick={() => {
                onUndo?.();
              }}
            />
          )}
          <Button
            size="small"
            style={{ pointerEvents: 'auto', padding: '2px' }}
            icon={<CloseIcon />}
            onClick={onClose}
          />
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
