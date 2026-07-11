import { useState } from 'react';

import Flex from '@/molecules/flex';
import Input from '@/molecules/input';
import Checkbox from '@/molecules/checkbox';
import Grid from '@/molecules/grid';
import { __ } from '@/wpi18n';

import type { ShippingMethodData } from '../utils';

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
      <Input
        label={__('Address', 'kirki-ecommerce')}
        value={(dataObj?.address as string) || ''}
        placeholder={__('Google map', 'kirki-ecommerce')}
        onChange={(value: unknown) => handleOnChange(value, 'address')}
      />
      <Input
        type="text"
        multiline={true}
        value={(dataObj?.description as string) || ''}
        label={__('Pickup Instructions', 'kirki-ecommerce')}
        placeholder={__('e.g., 3-5 business days', 'kirki-ecommerce')}
        style={{
          padding: 'var(--decom-spacing-2) var(--decom-spacing-3)',
          minHeight: '108px',
        }}
        onChange={(value: unknown) => handleOnChange(value, 'description')}
      />
      <Checkbox
        value={hasFee}
        label={__('Has a pickup fee', 'kirki-ecommerce')}
        onChange={(value: unknown) => {
          handleOnChange(value, 'has_fee');
          setHasFee(!hasFee);
        }}
      />
      {hasFee && (
        <Input
          label={__('Fee', 'kirki-ecommerce')}
          type={'number'}
          placeholder={__('$0.00', 'kirki-ecommerce')}
          value={(dataObj?.amount as string | number) || ''}
          onChange={(value: unknown) => handleOnChange(value, 'amount')}
        />
      )}
      <Checkbox
        value={hasPickTime}
        label={__('Pickup time available', 'kirki-ecommerce')}
        onChange={(value: unknown) => {
          handleOnChange(value, 'has_pick_time');
          setHasPickTime(!hasPickTime);
        }}
      />
      {hasPickTime && (
        <Grid>
          <Input
            type="time"
            value={dataObj?.['pickup_time_start'] as string}
            label={__('Start time', 'kirki-ecommerce')}
            onChange={(value: unknown) =>
              handleOnChange(value, 'pickup_time_start')
            }
          />
          <Input
            type="time"
            value={dataObj?.['pickup_time_end'] as string}
            label={__('End time', 'kirki-ecommerce')}
            onChange={(value: unknown) =>
              handleOnChange(value, 'pickup_time_end')
            }
          />
        </Grid>
      )}
    </Flex>
  );
};

LocalPickupSettings.displayName = 'LocalPickupSettings';

export default LocalPickupSettings;
