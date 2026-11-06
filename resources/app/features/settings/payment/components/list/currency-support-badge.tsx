import Badge from '@/components/ui/badge';
import InfoTooltip from '@/components/ui/info-tooltip';
import type { PaymentMethod } from '@/features/settings/payment/schemas/catalog/payment';
import { __ } from '@/wpi18n';

type CurrencySupportBadgeProps = {
  support: PaymentMethod['currency_support'];
};

const CurrencySupportBadge = ({ support }: CurrencySupportBadgeProps) => {
  if (!support || support.status === 'supported') {
    return null;
  }

  const isUnsupported = support.status === 'unsupported';

  return (
    <Badge variant={isUnsupported ? 'destructive' : 'warning'}>
      <InfoTooltip
        infoText={support.message}
        variant={isUnsupported ? 'critical' : 'warning'}
      >
        {isUnsupported ? __('Unsupported', 'kirki-ecommerce') : __('Limited', 'kirki-ecommerce')}
      </InfoTooltip>
    </Badge>
  );
};

CurrencySupportBadge.displayName = 'CurrencySupportBadge';

export default CurrencySupportBadge;
