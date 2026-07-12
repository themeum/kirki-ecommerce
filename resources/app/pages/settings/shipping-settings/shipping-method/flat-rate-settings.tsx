import Flex from '@/molecules/flex';
import Input from '@/molecules/input';
import Checkbox from '@/molecules/checkbox';
import { __ } from '@/wpi18n';

import type { ShippingMethodData } from '@/pages/settings/shipping-settings/utils';

type FlatRateSettingsProps = {
  handleOnChange: (value: unknown, key: string) => void;
  dataObj: ShippingMethodData | Record<string, unknown>;
};

const FlatRateSettings = ({
  handleOnChange,
  dataObj,
}: FlatRateSettingsProps) => {
  return (
    <Flex direction="column" gap={16}>
      <Input
        label={__('Rate', 'kirki-ecommerce')}
        value={(dataObj?.amount as string | number) || ''}
        type="number"
        placeholder={__('$0.00', 'kirki-ecommerce')}
        onChange={(value: unknown) => handleOnChange(value, 'amount')}
      />

      <Checkbox
        value={(dataObj?.['is_taxable'] as boolean) || false}
        label={__('This method is taxable', 'kirki-ecommerce')}
        onChange={(value: unknown) => handleOnChange(value, 'is_taxable')}
      />

      <Input
        multiline
        value={(dataObj?.description as string) || ''}
        label={__('Description', 'kirki-ecommerce')}
        placeholder={__('e.g., 3–5 business days', 'kirki-ecommerce')}
        onChange={(value: unknown) => handleOnChange(value, 'description')}
        style={{
          padding: 'var(--decom-spacing-2) var(--decom-spacing-3)',
          minHeight: '108px',
        }}
      />
    </Flex>
  );
};

FlatRateSettings.displayName = 'FlatRateSettings';

export default FlatRateSettings;
