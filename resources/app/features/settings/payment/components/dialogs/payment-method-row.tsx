import { Info } from 'lucide-react';
import type { ReactNode } from 'react';

import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import Text from '@/components/ui/text';
import Tooltip from '@/components/ui/tooltip';
import type { PaymentMethodRowStatus } from '@/features/settings/payment/utils/payment-method-rows';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type PaymentMethodRowProps = {
  name: string;
  icon: ReactNode;
  status: PaymentMethodRowStatus;
  isBusy: boolean;
  isDisabled: boolean;
  blockedReason?: string | null;
  onAdd: () => void;
  onUpdate?: () => void;
};

const PaymentMethodRow = (props: PaymentMethodRowProps) => {
  const { name, icon, status, isBusy, isDisabled, blockedReason, onAdd, onUpdate } = props;
  const hasUpdate = status === 'update-available' || status === 'update-blocked';

  const renderAction = () => {
    if (status === 'not-added') {
      return (
        <Button
          variant="ghost"
          size="sm"
          disabled={isDisabled}
          loading={isBusy}
          onClick={onAdd}
          data-slot="payment-method-add"
          cssOverride={styles.addButton}
        >
          {__('Add', 'kirki-ecommerce')}
        </Button>
      );
    }

    if (status === 'update-available') {
      return (
        <Button
          variant="secondary"
          size="sm"
          disabled={isDisabled}
          loading={isBusy}
          onClick={onUpdate}
        >
          {__('Update', 'kirki-ecommerce')}
        </Button>
      );
    }

    if (status === 'update-blocked' && blockedReason) {
      return (
        <Tooltip tip={blockedReason} position="left" cssOverride={styles.blockedInfo}>
          <Info aria-label={blockedReason} size={16} />
        </Tooltip>
      );
    }

    return null;
  };

  return (
    <div css={scoped(styles.row)}>
      <span css={scoped(styles.icon)}>{icon}</span>
      <span css={scoped(styles.label)}>
        <Text variant="small" weight="medium">
          {name}
        </Text>
        {status === 'added' && <Badge size="sm">{__('Added', 'kirki-ecommerce')}</Badge>}
        {hasUpdate && (
          <Badge size="sm" variant="info">
            {__('Update Available', 'kirki-ecommerce')}
          </Badge>
        )}
      </span>
      <span css={scoped(styles.action)}>{renderAction()}</span>
    </div>
  );
};

PaymentMethodRow.displayName = 'PaymentMethodRow';

export default PaymentMethodRow;

const styles = defineStyles({
  row: {
    display: 'flex',
    alignItems: 'center',
    columnGap: theme.spacing[2],
    minHeight: theme.spacing[10],
    padding: `0 ${theme.spacing[2]}`,
    borderRadius: theme.radius.lg,
    '& [data-slot="payment-method-add"]': {
      opacity: 0,
    },
    '& [data-slot="payment-method-add"][data-loading="true"]': {
      opacity: 1,
    },
    '&:hover, &:focus-within': {
      backgroundColor: theme.colors.background.surfaceAlt,
      '& [data-slot="payment-method-add"]': {
        opacity: 1,
      },
    },
    '@media (hover: none)': {
      '& [data-slot="payment-method-add"]': {
        opacity: 1,
      },
    },
  },
  icon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '20px',
    height: '20px',
    color: theme.colors.icon.secondary,
  },
  label: {
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: theme.spacing[2],
    flex: 1,
    minWidth: 0,
  },
  action: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexShrink: 0,
    minWidth: theme.spacing[12],
    minHeight: theme.spacing[7],
  },
  addButton: {
    color: theme.colors.text.brand,
    '&:hover': {
      color: theme.colors.text.brand,
    },
  },
  blockedInfo: {
    color: theme.colors.icon.primary,
    cursor: 'help',
  },
});
