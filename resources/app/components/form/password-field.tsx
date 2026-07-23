import { css, type SerializedStyles } from '@emotion/react';
import { useState, type ReactNode } from 'react';
import {
  useFormContext,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import classNames from 'classnames';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import Input from '@/components/ui/input';
import { CLASS_PREFIX } from '@/conf';
import { __ } from '@/wpi18n';

type PasswordFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: ReactNode;
  description?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  css?: SerializedStyles;
};

const PasswordField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  placeholder,
  disabled,
  css,
}: PasswordFieldProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();
  const [visible, setVisible] = useState(false);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem css={css}>
          {label && <FormLabel>{label}</FormLabel>}
          <div className={`${CLASS_PREFIX}-ui-password-field`}>
            <FormControl>
              <Input
                {...field}
                value={field.value ?? ''}
                type={visible ? 'text' : 'password'}
                placeholder={placeholder}
                disabled={disabled}
                error={Boolean(fieldState.error)}
                css={inputCss}
              />
            </FormControl>
            <button
              type="button"
              className={classNames(`${CLASS_PREFIX}-ui-password-field-toggle`)}
              onClick={() => setVisible((prev) => !prev)}
              aria-label={
                visible
                  ? __('Hide password', 'kirki-ecommerce')
                  : __('Show password', 'kirki-ecommerce')
              }
              tabIndex={0}
            >
              {visible ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

PasswordField.displayName = 'PasswordField';

export default PasswordField;

const inputCss = css({ paddingRight: '40px' });
