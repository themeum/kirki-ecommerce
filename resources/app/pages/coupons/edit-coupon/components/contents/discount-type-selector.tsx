import { Check, CircleDollarSign, Package, Truck } from 'lucide-react';
import { Controller, useFormContext } from 'react-hook-form';

import { Field, FieldLabel } from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Text from '@/components/ui/text';
import type { CouponFormValues } from '@/schemas/forms/coupon-form';
import { theme } from '@/theme';
import { defineStyles, uiFocusRing } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const options = [
  {
    value: 'amount-off',
    label: __('Amount Off', 'kirki-ecommerce'),
    icon: <CircleDollarSign size={20} />,
    hidden: false,
  },
  {
    value: 'free-shipping',
    label: __('Free Shipping', 'kirki-ecommerce'),
    icon: <Truck size={20} />,
    hidden: true,
  },
  {
    value: 'buy-x-get-y',
    label: __('Buy X get Y', 'kirki-ecommerce'),
    icon: <Package size={20} />,
    hidden: true,
  },
] as const;

const DiscountTypeSelector = () => {
  const { control } = useFormContext<CouponFormValues>();

  return (
    <Controller
      control={control}
      name="discount_type"
      render={({ field }) => (
        <RadioGroup
          value={field.value}
          onValueChange={field.onChange}
          cssOverride={styles.root}
          disabled
        >
          {options.map((option) => {
            const optionId = `discount-type-${option.value}`;
            const isSelected = field.value === option.value;

            if (option.hidden) {
              return null;
            }

            return (
              <FieldLabel key={option.value} htmlFor={optionId} cssOverride={styles.card}>
                <RadioGroupItem
                  value={option.value}
                  id={optionId}
                  cssOverride={styles.hiddenRadio}
                />
                {isSelected && (
                  <span css={styles.checkBadge} aria-hidden="true">
                    <Check size={10} strokeWidth={3} />
                  </span>
                )}
                <Field orientation="vertical" cssOverride={styles.cardField}>
                  <span css={styles.iconBadge}>{option.icon}</span>
                  <Text variant='small' weight="medium">{option.label}</Text>
                </Field>
              </FieldLabel>
            );
          })}
        </RadioGroup>
      )}
    />
  );
};

DiscountTypeSelector.displayName = 'DiscountTypeSelector';

export default DiscountTypeSelector;

const styles = defineStyles({
  root: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: theme.spacing[3],
  },
  card: {
    position: 'relative',
    cursor: 'pointer',
    '&:focus-within': {
      ...uiFocusRing(theme),
    },
  },
  cardField: {
    alignItems: 'center',
    gap: theme.spacing[3],
    textAlign: 'center',
    padding: `${theme.spacing[6]} !important`,
  },
  iconBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.full,
    color: theme.colors.icon.primary
  },
  hiddenRadio: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 'none',
  },
  checkBadge: {
    position: 'absolute',
    top: theme.spacing[3],
    right: theme.spacing[3],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '18px',
    height: '18px',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.fillBrand,
    color: theme.colors.text.light,
  },
});
