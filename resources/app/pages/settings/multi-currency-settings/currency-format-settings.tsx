import SelectField from '@/components/form/select-field';
import { Card } from '@/components/ui/card';
import { CLASS_PREFIX } from '@/conf';
import Flex from '@/components/ui/flex';
import { __ } from '@/wpi18n';

const CurrencyFormatSettings = () => {
  const separatorOptions = [
    { label: __('Comma (,)', 'kirki-ecommerce'), value: ',' },
    { label: __('Dot (.)', 'kirki-ecommerce'), value: '.' },
    { label: __('Space', 'kirki-ecommerce'), value: 'space' },
  ];

  return (
    <Card
      className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-inner`}
      style={{ padding: '16px' }}
    >
      <Flex direction="column" gap={16}>
        <SelectField
          name="currency_format"
          label={__('Currency format', 'kirki-ecommerce')}
          options={[
            { label: __('Short', 'kirki-ecommerce'), value: 'short' },
            { label: __('Long', 'kirki-ecommerce'), value: 'long' },
          ]}
        />

        <SelectField
          name="currency_position"
          label={__('Currency position', 'kirki-ecommerce')}
          options={[
            { label: __('Before', 'kirki-ecommerce'), value: 'before' },
            { label: __('After', 'kirki-ecommerce'), value: 'after' },
          ]}
        />

        <SelectField
          name="thousand_separator"
          label={__('Thousands separator', 'kirki-ecommerce')}
          options={separatorOptions}
        />

        <SelectField
          name="decimal_separator"
          label={__('Decimals separator', 'kirki-ecommerce')}
          options={separatorOptions}
        />
      </Flex>
    </Card>
  );
};

CurrencyFormatSettings.displayName = 'CurrencyFormatSettings';

export default CurrencyFormatSettings;
