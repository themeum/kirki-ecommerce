import { useState, useEffect } from 'react';

import Button from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import Checkbox from '@/components/ui/checkbox';
import { FormFieldRow } from '@/components/ui/form';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import Textarea from '@/components/ui/textarea';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';
import { PlusIcon, TrashIcon } from '@/icons';

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
          css={styles.textarea}
          onChange={(e) => handleOnChange(e.target.value, 'description')}
        />
      </Flex>
      <Card css={[styles.formCard, styles.rangesCard]} >
        <CardContent>

        <Grid columns={3}>
        <Text header={__('Weight Range (kg)', 'kirki-ecommerce')} />
        <Text />
        <Text header={__('Rate', 'kirki-ecommerce')} />
        </Grid>
        {ranges?.map((range, index) => (
        <Grid columns={3} key={index}>
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
        <div css={styles.rateRow} data-hover-parent>
        <Input
        value={range.amount || ''}
        type="number"
        placeholder={__('e.g. 120Tk', 'kirki-ecommerce')}
        onChange={(e) => updateRange(index, 'amount', e.target.value)}
        />

        {index !== 0 && (
        <Button
        variant="secondary"
        css={styles.deleteButton}
        data-hover-reveal
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
        </CardContent>
      </Card>

      <FormFieldRow>
        <Checkbox
          id="rate-by-weight-is-taxable"
          checked={dataObj?.['is_taxable'] as boolean}
          onCheckedChange={(checked) => handleOnChange(checked === true, 'is_taxable')}
        />
        <Label htmlFor="rate-by-weight-is-taxable">
          {__('Tax applies to the shipping charge', 'kirki-ecommerce')}
        </Label>
      </FormFieldRow>
      <FormFieldRow>
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
      </FormFieldRow>
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

const styles = {
  formCard: scoped({ rowGap: theme.spacing['2xl'] }),
  textarea: scoped({
    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
    minHeight: '108px',
  }),
  rangesCard: scoped({
    border: `1px solid ${theme.colors.border.default}`,
    borderRadius: theme.radius.md,
  }),
  rateRow: scoped({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing['2xl'],
    '&:hover [data-hover-reveal]': {
      opacity: 1,
      visibility: 'visible',
      display: 'block',
    },
  }),
  deleteButton: scoped({
    padding: theme.spacing.xs,
    opacity: 0,
    display: 'none',
    visibility: 'hidden',
    transition: 'opacity 0.2s ease',
    cursor: 'pointer',
    background: theme.colors.background.fillSecondary,
    borderRadius: theme.radius.lg,
  }),
};
