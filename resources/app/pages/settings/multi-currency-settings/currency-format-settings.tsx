import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import { Select } from '@/molecules/select';
import type { FormErrors, SettingsSectionData } from '@/types';
import { __ } from '@/wpi18n';

type CurrencyFormatSettingsProps = {
  handleOnChange: (value: unknown, key: string) => void;
  dataObj: SettingsSectionData;
  errors: FormErrors;
};

const CurrencyFormatSettings = ({
  handleOnChange,
  dataObj,
  errors,
}: CurrencyFormatSettingsProps) => {
  const optionsArray = [
    { title: __('Comma (,)', 'kirki-ecommerce'), value: ',' },
    { title: __('Dot (.)', 'kirki-ecommerce'), value: '.' },
    { title: __('Space', 'kirki-ecommerce'), value: 'space' },
  ];
  return (
    <Card type="inner" style={{ padding: '16px' }}>
      <Flex direction="column" gap={16}>
        <Select
          label={__('Currency format', 'kirki-ecommerce')}
          onChange={(value) => handleOnChange(value, 'currency_format')}
          optionsArray={[
            { title: __('Short', 'kirki-ecommerce'), value: 'short' },
            { title: __('Long', 'kirki-ecommerce'), value: 'long' },
          ]}
          value={dataObj['currency_format'] as string | number | undefined}
          error={errors['data.currency_format'] as string | boolean | undefined}
        />

        <Select
          label={__('Currency position', 'kirki-ecommerce')}
          onChange={(value) => handleOnChange(value, 'currency_position')}
          optionsArray={[
            { title: __('Before', 'kirki-ecommerce'), value: 'before' },
            { title: __('After', 'kirki-ecommerce'), value: 'after' },
          ]}
          value={dataObj['currency_position'] as string | number | undefined}
          error={errors['data.currency_position'] as string | boolean | undefined}
        />

        <Select
          label={__('Thousands separator', 'kirki-ecommerce')}
          onChange={(value) => handleOnChange(value, 'thousand_separator')}
          optionsArray={optionsArray}
          value={dataObj['thousand_separator'] as string | number | undefined}
          error={errors['data.thousand_separator'] as string | boolean | undefined}
        />

        <Select
          label={__('Decimals separator', 'kirki-ecommerce')}
          onChange={(value) => handleOnChange(value, 'decimal_separator')}
          optionsArray={optionsArray}
          value={dataObj['decimal_separator'] as string | number | undefined}
          error={errors['data.decimal_separator'] as string | boolean | undefined}
        />
      </Flex>
    </Card>
  );
};

export default CurrencyFormatSettings;
