import { useFormContext, useWatch } from 'react-hook-form';

import CheckboxField from '@/components/form/checkbox-field';
import MoneyField from '@/components/form/money-field';
import TextField from '@/components/form/text-field';
import TextareaField from '@/components/form/textarea-field';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import type { ShippingMethodFormInput } from '@/features/settings/shipping/schemas/forms/shipping-method-form';
import { __ } from '@/wpi18n';

const LocalPickupSettings = () => {
  const { control } = useFormContext<ShippingMethodFormInput>();
  const hasFee = useWatch({ control, name: 'has_fee' });
  const hasPickTime = useWatch({ control, name: 'has_pick_time' });

  return (
    <Flex direction="column" gap={4}>
      <TextField
        name="address"
        label={__('Address', 'kirki-ecommerce')}
        placeholder={__('Google map', 'kirki-ecommerce')}
      />
      <TextareaField
        name="description"
        label={__('Pickup Instructions', 'kirki-ecommerce')}
        placeholder={__('e.g., 3-5 business days', 'kirki-ecommerce')}
        rows={4}
      />
      <CheckboxField
        name="has_fee"
        label={__('Has a pickup fee', 'kirki-ecommerce')}
      />
      {hasFee && (
        <MoneyField
          name="base_amount"
          label={__('Fee', 'kirki-ecommerce')}
          placeholder={__('0.00', 'kirki-ecommerce')}
        />
      )}
      <CheckboxField
        name="has_pick_time"
        label={__('Pickup time available', 'kirki-ecommerce')}
      />
      {hasPickTime && (
        <Grid>
          <TextField
            name="pickup_time_start"
            type="time"
            label={__('Start time', 'kirki-ecommerce')}
          />
          <TextField
            name="pickup_time_end"
            type="time"
            label={__('End time', 'kirki-ecommerce')}
          />
        </Grid>
      )}
    </Flex>
  );
};

LocalPickupSettings.displayName = 'LocalPickupSettings';

export default LocalPickupSettings;
