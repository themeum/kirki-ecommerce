import { useMemo } from 'react';
import { Controller, type FieldPath, type FieldValues, useFormContext } from 'react-hook-form';

import Combobox from '@/components/ui/combobox';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { getCurrencyFlag } from '@/features/onboarding/lib/currency-flag';
import { useAllCurrenciesQuery } from '@/features/settings';
import { useCountriesQuery } from '@/services/country';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type CurrencyFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: string;
};

const CurrencyField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label = __('Currency', 'kirki-ecommerce'),
}: CurrencyFieldProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();
  const { data: currencies = [] } = useAllCurrenciesQuery();
  const { data: countries = [] } = useCountriesQuery({ limit: -1 });

  const options = useMemo(() => {
    const countryCodes = countries.map((country) => country.code);

    return currencies.map((currency) => {
      const flag = getCurrencyFlag(currency.code, countryCodes);

      return {
        value: currency.code,
        label: `${currency.name} (${currency.code})`,
        leftIcon: flag ? <span css={scoped(styles.flag)}>{flag}</span> : undefined,
        keywords: [currency.code, currency.symbol ?? ''],
      };
    });
  }, [currencies, countries]);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <FieldLabel htmlFor={String(name)}>{label}</FieldLabel>
          <Combobox
            options={options}
            value={typeof field.value === 'string' ? field.value : ''}
            onChange={(nextValue) => {
              field.onChange(Array.isArray(nextValue) ? (nextValue[0] ?? '') : nextValue);
            }}
            placeholder={__('Select a currency', 'kirki-ecommerce')}
            searchPlaceholder={__('Search currencies', 'kirki-ecommerce')}
            error={Boolean(fieldState.error)}
            listCss={styles.list}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

CurrencyField.displayName = 'CurrencyField';

export default CurrencyField;

const styles = defineStyles({
  list: {
    maxHeight: '220px',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  flag: {
    fontSize: '16px',
    lineHeight: 1,
  },
});
