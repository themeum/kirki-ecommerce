import CheckboxField from '@/components/form/checkbox-field';
import MoneyField from '@/components/form/money-field';
import TextareaField from '@/components/form/textarea-field';
import Flex from '@/components/ui/flex';
import { __ } from '@/wpi18n';

const FlatRateSettings = () => {
  return (
    <Flex direction="column" gap={4}>
      <MoneyField
        name="base_amount"
        label={__('Rate', 'kirki-ecommerce')}
        placeholder={__('0.00', 'kirki-ecommerce')}
      />
      <CheckboxField
        name="is_taxable"
        label={__('This method is taxable', 'kirki-ecommerce')}
      />
      <TextareaField
        name="description"
        label={__('Description', 'kirki-ecommerce')}
        placeholder={__('e.g., 3–5 business days', 'kirki-ecommerce')}
        rows={4}
      />
    </Flex>
  );
};

FlatRateSettings.displayName = 'FlatRateSettings';

export default FlatRateSettings;
