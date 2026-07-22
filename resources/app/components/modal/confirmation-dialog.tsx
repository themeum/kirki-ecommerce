import type { ReactNode } from 'react';
import { Info, Trash2 } from 'lucide-react';
import classNames from 'classnames';

import Button from '@/components/ui/button';
import {
  Dialog,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CLASS_PREFIX } from '@/conf';
import type { ConfirmationVariant } from '@/types';
import { __ } from '@/wpi18n';

type ConfirmationDialogProps = {
  open?: boolean;
  variant?: ConfirmationVariant;
  title?: string;
  subtitle?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
};

type VariantUi = {
  confirmText: string;
  confirmVariant: 'primary' | 'secondary' | 'destructive';
  icon: ReactNode;
  iconBg: string;
};

const ConfirmationDialog = (props: ConfirmationDialogProps) => {
  const {
    open = true,
    variant = 'default',
    title,
    subtitle,
    onConfirm,
    onCancel,
  } = props;

  const VARIANT_UI: Record<ConfirmationVariant, VariantUi> = {
    default: {
      confirmText: __('Leave', 'kirki-ecommerce'),
      confirmVariant: 'primary',
      icon: <Info size={20} aria-hidden="true" />,
      iconBg: '#EBE8FE',
    },
    warning: {
      confirmText: __('Proceed', 'kirki-ecommerce'),
      confirmVariant: 'secondary',
      icon: <Info size={20} aria-hidden="true" />,
      iconBg: '#EBE8FE',
    },
    delete: {
      confirmText: __('Delete', 'kirki-ecommerce'),
      confirmVariant: 'destructive',
      icon: <Trash2 size={20} aria-hidden="true" />,
      iconBg: '#FFE5E4',
    },
  };

  const ui = VARIANT_UI[variant];

  const finalTitle =
    variant === 'default'
      ? __('Unsaved changes', 'kirki-ecommerce')
      : (title ?? '');

  const finalSubtitle =
    variant === 'default'
      ? __('You have unsaved changes. Leave anyway?', 'kirki-ecommerce')
      : (subtitle ?? '');

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onCancel?.();
        }
      }}
    >
      <DialogContent
        className={`${CLASS_PREFIX}-confirmation-dialog`}
        style={{ width: 400 }}
      >
        <DialogCloseButton />
        <DialogHeader className={`${CLASS_PREFIX}-confirmation-dialog-header`}>
          <span
            className={`${CLASS_PREFIX}-confirmation-dialog-icon`}
            style={{ background: ui.iconBg }}
            aria-hidden="true"
          >
            {ui.icon}
          </span>
          <DialogTitle>{finalTitle || __('Confirm', 'kirki-ecommerce')}</DialogTitle>
          {!!finalSubtitle && (
            <DialogDescription>{finalSubtitle}</DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter className={`${CLASS_PREFIX}-confirmation-dialog-footer`}>
          <Button
            className={`${CLASS_PREFIX}-confirmation-dialog-action`}
            variant="outline"
            onClick={onCancel}
          >
            {__('Cancel', 'kirki-ecommerce')}
          </Button>
          <Button
            className={classNames(
              `${CLASS_PREFIX}-confirmation-dialog-action`,
            )}
            variant={ui.confirmVariant}
            onClick={onConfirm}
          >
            {ui.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

ConfirmationDialog.displayName = 'ConfirmationDialog';

export default ConfirmationDialog;
