import { useState } from 'react';

import Checkbox from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import Textarea from '@/components/ui/textarea';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

import type { ShippingMethodData } from '@/pages/settings/shipping-settings/utils';

type LocalPickupSettingsProps = {
  handleOnChange: (value: unknown, key: string) => void;
  dataObj: ShippingMethodData | Record<string, unknown>;
};

const LocalPickupSettings = ({
  handleOnChange,
  dataObj,
}: LocalPickupSettingsProps) => {
  const [hasFee, setHasFee] = useState<boolean>(
    (dataObj?.['has_fee'] as boolean) || true,
  );
  const [hasPickTime, setHasPickTime] = useState<boolean>(
    (dataObj?.['has_pick_time'] as boolean) || false,
  );

  return (
    <Flex direction="column" gap={4}>
      <Flex direction="column" gap={2}>
        <Label htmlFor="local-pickup-address">
          {__('Address', 'kirki-ecommerce')}
        </Label>
        <Input
          id="local-pickup-address"
          value={(dataObj?.address as string) || ''}
          placeholder={__('Google map', 'kirki-ecommerce')}
          onChange={(e) => handleOnChange(e.target.value, 'address')}
        />
      </Flex>
      <Flex direction="column" gap={2}>
        <Label htmlFor="local-pickup-description">
          {__('Pickup Instructions', 'kirki-ecommerce')}
        </Label>
        <Textarea
          id="local-pickup-description"
          value={(dataObj?.description as string) || ''}
          placeholder={__('e.g., 3-5 business days', 'kirki-ecommerce')}
          cssOverride={styles.textarea}
          onChange={(e) => handleOnChange(e.target.value, 'description')}
        />
      </Flex>
      <Field orientation="horizontal">
        <Checkbox
          id="local-pickup-has-fee"
          checked={hasFee}
          onCheckedChange={(checked) => {
            handleOnChange(checked === true, 'has_fee');
            setHasFee(!hasFee);
          }}
        />
        <FieldLabel htmlFor="local-pickup-has-fee">
          {__('Has a pickup fee', 'kirki-ecommerce')}
        </FieldLabel>
      </Field>
      {hasFee && (
        <Flex direction="column" gap={2}>
          <Label htmlFor="local-pickup-fee">{__('Fee', 'kirki-ecommerce')}</Label>
          <Input
            id="local-pickup-fee"
            type="number"
            placeholder={__('$0.00', 'kirki-ecommerce')}
            value={(dataObj?.amount as string | number) || ''}
            onChange={(e) => handleOnChange(e.target.value, 'amount')}
          />
        </Flex>
      )}
      <Field orientation="horizontal">
        <Checkbox
          id="local-pickup-has-pick-time"
          checked={hasPickTime}
          onCheckedChange={(checked) => {
            handleOnChange(checked === true, 'has_pick_time');
            setHasPickTime(!hasPickTime);
          }}
        />
        <FieldLabel htmlFor="local-pickup-has-pick-time">
          {__('Pickup time available', 'kirki-ecommerce')}
        </FieldLabel>
      </Field>
      {hasPickTime && (
        <Grid>
          <Flex direction="column" gap={2}>
            <Label htmlFor="local-pickup-time-start">
              {__('Start time', 'kirki-ecommerce')}
            </Label>
            <Input
              id="local-pickup-time-start"
              type="time"
              value={(dataObj?.['pickup_time_start'] as string) || ''}
              onChange={(e) =>
                handleOnChange(e.target.value, 'pickup_time_start')
              }
            />
          </Flex>
          <Flex direction="column" gap={2}>
            <Label htmlFor="local-pickup-time-end">
              {__('End time', 'kirki-ecommerce')}
            </Label>
            <Input
              id="local-pickup-time-end"
              type="time"
              value={(dataObj?.['pickup_time_end'] as string) || ''}
              onChange={(e) =>
                handleOnChange(e.target.value, 'pickup_time_end')
              }
            />
          </Flex>
        </Grid>
      )}
    </Flex>
  );
};

LocalPickupSettings.displayName = 'LocalPickupSettings';

export default LocalPickupSettings;

const styles = defineStyles({
  textarea: {
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
    minHeight: '108px',
  },
});
