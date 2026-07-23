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
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import RichText from '@/components/rich-text';

type RichTextFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: ReactNode;
  description?: ReactNode;
  placeholder?: string;
  id?: string;
  css?: SerializedStyles;
};

const RichTextField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  placeholder,
  id,
  css,
}: RichTextFieldProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem css={css}>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <RichText
              id={id ?? String(name)}
              value={field.value ?? ''}
              onChange={field.onChange}
              placeholder={placeholder}
              error={Boolean(fieldState.error)}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

RichTextField.displayName = 'RichTextField';

export default RichTextField;
