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
import Switch from '@/components/ui/switch';

type SwitchFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  css?: SerializedStyles;
};

const SwitchField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  disabled,
  css,
}: SwitchFieldProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem css={css}>
          <FormFieldRow>
            <FormControl>
              <Switch
                checked={Boolean(field.value)}
                onCheckedChange={field.onChange}
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

SwitchField.displayName = 'SwitchField';

export default SwitchField;
