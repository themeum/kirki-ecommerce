import { useEffect, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import MoneyField from '@/components/form/money-field';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { defineStyles, flexCenter, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type GroupPriceCellProps = {
  minPrice: number;
  maxPrice: number;
  currencySymbol: string;
  onCommit: (value: number) => void;
};

type PriceEditForm = {
  amount: string | number | null;
};

const GroupPriceCell = ({ minPrice, maxPrice, currencySymbol, onCommit }: GroupPriceCellProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const form = useForm<PriceEditForm>({ defaultValues: { amount: minPrice } });
  const amount = useWatch({ control: form.control, name: 'amount' });

  useEffect(() => {
    if (!isEditing) {
      form.reset({ amount: minPrice });
    }
    // Only re-seed the display value when not actively editing — while
    // editing, minPrice changes on every keystroke (it mirrors what was
    // just committed) and re-seeding would fight the user's typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minPrice, isEditing]);

  useEffect(() => {
    if (!isEditing || amount === '' || amount === null || amount === undefined) {
      return;
    }

    const parsed = Number(amount);

    if (Number.isFinite(parsed)) {
      onCommit(parsed);
    }
  }, [amount, isEditing, onCommit]);

  if (!isEditing) {
    const label =
      minPrice === maxPrice
        ? `${currencySymbol} ${minPrice}`
        : `${currencySymbol} ${minPrice} - ${maxPrice}`;

    return (
      <div
        role="button"
        tabIndex={0}
        aria-label={__('Edit price', 'kirki-ecommerce')}
        onClick={() => setIsEditing(true)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setIsEditing(true);
          }
        }}
        style={{ cursor: 'pointer', textAlign: 'center' }}
      >
        <div css={scoped(styles.wrapper)}>
          <Text variant="small">{label}</Text>
        </div>
      </div>
    );
  }

  return (
    <div onBlur={() => setIsEditing(false)}>
      <FormProvider {...form}>
        <MoneyField name="amount" currencySymbol={currencySymbol} />
      </FormProvider>
    </div>
  );
};

GroupPriceCell.displayName = 'GroupPriceCell';

export default GroupPriceCell;

const styles = defineStyles({
  wrapper: {
    width: '100%',
    height: 36,
    borderRadius: theme.radius.lg,
    border: `1px solid ${theme.colors.border.default}`,
    padding: `${theme.spacing[1]} ${theme.spacing[3]}`,
    ...flexCenter(),
  },
})
