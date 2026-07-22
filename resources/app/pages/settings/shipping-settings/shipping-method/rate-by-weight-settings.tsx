import { useState, useEffect } from 'react';

import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Checkbox from '@/components/ui/checkbox';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import Textarea from '@/components/ui/textarea';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import Text from '@/components/ui/text';
import { __ } from '@/wpi18n';
import { PlusIcon, TrashIcon } from '@/icons';
import { CLASS_PREFIX } from '@/conf';

import type { ShippingMethodData } from '@/pages/settings/shipping-settings/utils';

type WeightRange = {
  from: number | string;
  to: number | string;
  amount: number | string;
};

type RateByWeightSettingsProps = {
  handleOnChange: (value: unknown, key: string) => void;
  dataObj: ShippingMethodData | Record<string, unknown>;
};

const RateByWeightSettings = ({
  handleOnChange,
  dataObj,
}: RateByWeightSettingsProps) => {
  const [hasFreeShipping, setHasFreeShipping] = useState(false);
  const initialRanges = dataObj?.ranges as WeightRange[] | undefined;
  const [ranges, setRanges] = useState<WeightRange[]>(
    initialRanges && initialRanges.length >= 1
      ? initialRanges
      : [{ from: '', to: '', amount: '' }],
  );

  useEffect(() => {
    handleOnChange(
      ranges
        .filter((r) => r.from !== '' && r.to !== '' && r.amount !== '')
        .map((r) => ({
          from: Number(r.from),
          to: Number(r.to),
          amount: Number(r.amount),
        })),
      'ranges',
    );
  }, [ranges]);

  const addRange = () => {
    setRanges((prev) => [...prev, { from: '', to: '', amount: '' }]);
  };

  const updateRange = (
    index: number,
    key: keyof WeightRange,
    value: unknown,
  ) => {
    setRanges((prev) =>
      prev.map((range, i) =>
        i === index ? { ...range, [key]: value as string | number } : range,
      ),
    );
  };

  const removeRange = (index: number) => {
    setRanges((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Flex direction="column" gap={16}>
      <Flex direction="column" gap={8}>
        <Label htmlFor="rate-by-weight-description">
          {__('Pickup Instructions', 'kirki-ecommerce')}
        </Label>
        <Textarea
          id="rate-by-weight-description"
          value={(dataObj?.description as string) || ''}
          placeholder={__('e.g., 3-5 business days', 'kirki-ecommerce')}
          style={{
            padding: 'var(--decom-spacing-2) var(--decom-spacing-3)',
            minHeight: '108px',
          }}
          onChange={(e) => handleOnChange(e.target.value, 'description')}
        />
      </Flex>
      <Card
        className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-form`}
        style={{
          border: '1px solid var(--decom-border-border)',
          borderRadius: 'var(--decom-radius-rounded-md)',
        }}
      >
        <Grid columns={3}>
          <Text header={__('Weight Range (kg)', 'kirki-ecommerce')} />
          <Text />
          <Text header={__('Rate', 'kirki-ecommerce')} />
        </Grid>
        {ranges?.map((range, index) => (
          <Grid
            columns={3}
            key={index}
            className={`${CLASS_PREFIX}-weight-rate-delete-icon`}
          >
            <Input
              value={range.from || ''}
              type="number"
              placeholder={__('e.g. 12', 'kirki-ecommerce')}
              onChange={(e) => updateRange(index, 'from', e.target.value)}
            />
            <Input
              value={range.to || ''}
              type="number"
              placeholder={__('e.g. 12', 'kirki-ecommerce')}
              onChange={(e) => updateRange(index, 'to', e.target.value)}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <Input
                value={range.amount || ''}
                type="number"
                placeholder={__('e.g. 120Tk', 'kirki-ecommerce')}
                onChange={(e) => updateRange(index, 'amount', e.target.value)}
              />

              {index !== 0 && (
                <Button
                  variant="secondary"
                  style={{ padding: 'var(--decom-spacing-1)' }}
                  onClick={() => removeRange(index)}
                >
                  <TrashIcon />
                </Button>
              )}
            </div>
          </Grid>
        ))}
        <Button variant="ghost" onClick={addRange}>
          <PlusIcon />
          {__('Add Another Range', 'kirki-ecommerce')}
        </Button>
      </Card>

      <div className={`${CLASS_PREFIX}-ui-checkbox-field`}>
        <Checkbox
          id="rate-by-weight-is-taxable"
          checked={dataObj?.['is_taxable'] as boolean}
          onCheckedChange={(checked) => handleOnChange(checked === true, 'is_taxable')}
        />
        <Label htmlFor="rate-by-weight-is-taxable">
          {__('Tax applies to the shipping charge', 'kirki-ecommerce')}
        </Label>
      </div>
      <div className={`${CLASS_PREFIX}-ui-checkbox-field`}>
        <Checkbox
          id="rate-by-weight-has-free-shipping"
          checked={hasFreeShipping}
          onCheckedChange={() => setHasFreeShipping(!hasFreeShipping)}
        />
        <Label htmlFor="rate-by-weight-has-free-shipping">
          {__(
            'Offer free shipping when a customer buys over a certain amount',
            'kirki-ecommerce',
          )}
        </Label>
      </div>
      {hasFreeShipping && (
        <Flex direction="column" gap={8}>
          <Label htmlFor="rate-by-weight-amount">
            {__('Amount', 'kirki-ecommerce')}
          </Label>
          <Input
            id="rate-by-weight-amount"
            placeholder={__('$0.00', 'kirki-ecommerce')}
            type="number"
            value={dataObj?.amount as string | number}
            onChange={(e) => handleOnChange(e.target.value, 'amount')}
          />
        </Flex>
      )}
    </Flex>
  );
};

RateByWeightSettings.displayName = 'RateByWeightSettings';

export default RateByWeightSettings;
