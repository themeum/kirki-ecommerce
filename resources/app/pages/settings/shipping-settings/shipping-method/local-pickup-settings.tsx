import { useState } from 'react';

import Checkbox from '@/components/ui/checkbox';
import Flex from '@/components/ui/flex';
import { FormFieldRow } from '@/components/ui/form';
import Grid from '@/components/ui/grid';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import Textarea from '@/components/ui/textarea';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
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
    <Flex direction="column" gap={16}>
      <Flex direction="column" gap={8}>
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
      <Flex direction="column" gap={8}>
        <Label htmlFor="local-pickup-description">
          {__('Pickup Instructions', 'kirki-ecommerce')}
        </Label>
        <Textarea
          id="local-pickup-description"
          value={(dataObj?.description as string) || ''}
          placeholder={__('e.g., 3-5 business days', 'kirki-ecommerce')}
          css={styles.textarea}
          onChange={(e) => handleOnChange(e.target.value, 'description')}
        />
      </Flex>
      <FormFieldRow>
        <Checkbox
          id="local-pickup-has-fee"
          checked={hasFee}
          onCheckedChange={(checked) => {
            handleOnChange(checked === true, 'has_fee');
            setHasFee(!hasFee);
          }}
        />
        <Label htmlFor="local-pickup-has-fee">
          {__('Has a pickup fee', 'kirki-ecommerce')}
        </Label>
      </FormFieldRow>
      {hasFee && (
        <Flex direction="column" gap={8}>
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
      <FormFieldRow>
        <Checkbox
          id="local-pickup-has-pick-time"
          checked={hasPickTime}
          onCheckedChange={(checked) => {
            handleOnChange(checked === true, 'has_pick_time');
            setHasPickTime(!hasPickTime);
          }}
        />
        <Label htmlFor="local-pickup-has-pick-time">
          {__('Pickup time available', 'kirki-ecommerce')}
        </Label>
      </FormFieldRow>
      {hasPickTime && (
        <Grid>
          <Flex direction="column" gap={8}>
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
          <Flex direction="column" gap={8}>
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

const styles = {
  textarea: scoped({
    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
    minHeight: '108px',
  }),
};
