import { InfoCircledIcon } from '@radix-ui/react-icons';

import Badge from '@/components/ui/badge';
import Tooltip from '@/components/ui/tooltip';
import type { PaymentMethod } from '@/features/settings/payment/schemas/catalog/payment';
import { __ } from '@/wpi18n';

type CurrencySupportBadgeProps = {
  support: PaymentMethod['currency_support'];
};

const CurrencySupportBadge = ({ support }: CurrencySupportBadgeProps) => {
  if (!support || support.status === 'supported') {
    return null;
  }

  return (
    <Badge variant={support.status === 'unsupported' ? 'destructive' : 'warning'}>
      {support.status === 'unsupported'
        ? __('Unsupported', 'kirki-ecommerce')
        : __('Limited', 'kirki-ecommerce')}
      {support.message && (
        <Tooltip tip={support.message} position="top">
          <InfoCircledIcon role="img" aria-label={support.message} />
        </Tooltip>
      )}
    </Badge>
  );
};

CurrencySupportBadge.displayName = 'CurrencySupportBadge';

export default CurrencySupportBadge;
