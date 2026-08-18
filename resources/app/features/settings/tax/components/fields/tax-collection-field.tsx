import { Controller, useFormContext } from 'react-hook-form';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { TaxSettingsFormInput } from '@/features/settings/tax/schemas/forms/tax-settings-form';
import { __ } from '@/wpi18n';

const options = [
  {
    title: __(
      'Tax should be calculated & displayed in the checkout page',
      'kirki-ecommerce',
    ),
    value: 'not_inclusive',
  },
  {
    title: __(
      'Tax is already included in product price and shipping rate',
      'kirki-ecommerce',
    ),
    value: 'inclusive',
    disabled: true,
  },
];

const TaxCollectionField = () => {
  const { control } = useFormContext<TaxSettingsFormInput>();

  return (
    <Controller
      control={control}
      name="is_tax_inclusive_price"
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <RadioGroup
            value={field.value ? 'inclusive' : 'not_inclusive'}
            onValueChange={(value) => field.onChange(value === 'inclusive')}
            aria-invalid={fieldState.invalid}
          >
            {options.map((option) => (
              <Field key={option.value} orientation="horizontal">
                <RadioGroupItem
                  value={option.value}
                  id={`tax-collection-${option.value}`}
                  disabled={option.disabled ?? false}
                />
                <FieldLabel htmlFor={`tax-collection-${option.value}`}>
                  {option.title}
                </FieldLabel>
              </Field>
            ))}
          </RadioGroup>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

TaxCollectionField.displayName = 'TaxCollectionField';

export default TaxCollectionField;
