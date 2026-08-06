import { useFormContext, useWatch } from 'react-hook-form';

import CheckboxField from '@/components/form/checkbox-field';
import MoneyField from '@/components/form/money-field';
import TextareaField from '@/components/form/textarea-field';
import WeightRangeField from '@/components/form/weight-range-field';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss } from '@/theme/mixins';
import { __ } from '@/wpi18n';

import type { ShippingMethodFormInput } from '@/schemas/forms/shipping-method-form';

const RateByWeightSettings = () => {
  const { control } = useFormContext<ShippingMethodFormInput>();
  const isFreeShippingEnabled = useWatch({ control, name: 'is_free_shipping_enabled' });

  return (
    <Flex direction="column" gap={4}>
      <TextareaField
        name="description"
        label={__('Pickup Instructions', 'kirki-ecommerce')}
        placeholder={__('e.g., 3-5 business days', 'kirki-ecommerce')}
        rows={4}
      />
      <Card cssOverride={mergeCss(cardStyles.formCard, styles.rangesCard)}>
        <CardContent>
          <WeightRangeField name="ranges" />
        </CardContent>
      </Card>
      <CheckboxField
        name="is_taxable"
        label={__('Tax applies to the shipping charge', 'kirki-ecommerce')}
      />
      <CheckboxField
        name="is_free_shipping_enabled"
        label={__('Offer free shipping when a customer buys over a certain amount', 'kirki-ecommerce')}
      />
      {isFreeShippingEnabled && (
        <MoneyField
          name="free_shipping_min_amount"
          label={__('Amount', 'kirki-ecommerce')}
          placeholder={__('0.00', 'kirki-ecommerce')}
        />
      )}
    </Flex>
  );
};

RateByWeightSettings.displayName = 'RateByWeightSettings';

export default RateByWeightSettings;

const styles = defineStyles({
  rangesCard: {
    border: `1px solid ${theme.colors.border.default}`,
    borderRadius: theme.radius.md,
  },
});
