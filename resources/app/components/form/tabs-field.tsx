import type { CSSObject } from '@emotion/react';
import type { ReactNode } from 'react';
import { Controller, type FieldPath, type FieldValues, useFormContext } from 'react-hook-form';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type TabsFieldOption = {
  value: string;
  label?: ReactNode;
  icon?: ReactNode;
};

type TabsFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  options: TabsFieldOption[];
  label?: ReactNode;
  description?: ReactNode;
  infoText?: ReactNode;
  cssOverride?: CSSObject;
  /** Maps the stored form value to the tab value. Defaults to `String`. */
  toTabValue?: (value: unknown) => string;
  /** Maps the selected tab value back to the stored form value. */
  fromTabValue?: (value: string) => unknown;
};

const TabsField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  options,
  label,
  description,
  infoText,
  cssOverride,
  toTabValue,
  fromTabValue,
}: TabsFieldProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined} cssOverride={cssOverride}>
          {label && <FieldLabel infoText={infoText}>{label}</FieldLabel>}
          <Tabs
            value={toTabValue ? toTabValue(field.value) : String(field.value ?? '')}
            onValueChange={(nextValue) => {
              field.onChange(fromTabValue ? fromTabValue(nextValue) : nextValue);
            }}
          >
            <TabsList aria-invalid={fieldState.invalid}>
              {options.map((option) => (
                <TabsTrigger key={option.value} value={option.value}>
                  {option.icon}
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

TabsField.displayName = 'TabsField';

export default TabsField;
export type { TabsFieldOption };
