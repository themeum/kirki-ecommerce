import { type SerializedStyles } from '@emotion/react';
import type { ReactNode } from 'react';
import {
  useFormContext,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';

import {
  FormControl,
  FormDescription,
  FormField,
  FormFieldRow,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import Checkbox from '@/components/ui/checkbox';

type CheckboxFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  css?: SerializedStyles;
};

const CheckboxField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  disabled,
  css,
}: CheckboxFieldProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem css={css}>
          <FormFieldRow>
            <FormControl>
              <Checkbox
                checked={Boolean(field.value)}
                onCheckedChange={(checked) => {
                  field.onChange(checked === true);
                }}
                disabled={disabled}
              />
            </FormControl>
            {label && <FormLabel>{label}</FormLabel>}
          </FormFieldRow>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

CheckboxField.displayName = 'CheckboxField';

export default CheckboxField;
