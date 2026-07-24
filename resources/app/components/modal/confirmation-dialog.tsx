import { Info, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';

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
import { theme } from '@/theme';
import { flexCenter, scoped } from '@/theme/mixins';
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
      iconBg: theme.colors.background.fillSpecial2Secondary,
    },
    warning: {
      confirmText: __('Proceed', 'kirki-ecommerce'),
      confirmVariant: 'secondary',
      icon: <Info size={20} aria-hidden="true" />,
      iconBg: theme.colors.background.fillSpecial2Secondary,
    },
    delete: {
      confirmText: __('Delete', 'kirki-ecommerce'),
      confirmVariant: 'destructive',
      icon: <Trash2 size={20} aria-hidden="true" />,
      iconBg: theme.colors.background.fillCriticalSecondary,
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
      <DialogContent css={styles.content}>
        <DialogCloseButton />
        <DialogHeader css={styles.header}>
          <span
            css={styles.icon}
            style={{ background: ui.iconBg }}
            aria-hidden="true"
          >
            {ui.icon}
          </span>
          <DialogTitle css={styles.title}>
            {finalTitle || __('Confirm', 'kirki-ecommerce')}
          </DialogTitle>
          {!!finalSubtitle && (
            <DialogDescription css={styles.description}>
              {finalSubtitle}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter css={styles.footer}>
          <Button css={styles.action} variant="outline" onClick={onCancel}>
            {__('Cancel', 'kirki-ecommerce')}
          </Button>
          <Button
            css={styles.action}
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

const styles = {
  content: scoped({
    width: '400px',
  }),
  header: scoped({
    alignItems: 'center',
    textAlign: 'center',
    paddingTop: theme.spacing[6],
  }),
  icon: scoped({
    ...flexCenter(),
    height: '40px',
    width: '40px',
    borderRadius: theme.radius.full,
    marginBottom: theme.spacing[2],
  }),
  title: scoped({
    ...theme.typography.heading4(),
    textAlign: 'center',
  }),
  description: scoped({
    ...theme.typography.small(),
    color: theme.colors.text.secondary,
    textAlign: 'center',
  }),
  footer: scoped({
    justifyContent: 'space-between',
    width: '100%',
    boxSizing: 'border-box',
  }),
  action: scoped({
    flex: 1,
  }),
};
