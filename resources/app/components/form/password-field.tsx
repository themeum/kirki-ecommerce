import type { CSSObject } from '@emotion/react';
import { Eye, EyeOff } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Controller, type FieldPath, type FieldValues, useFormContext } from 'react-hook-form';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import Input from '@/components/ui/input';
import { theme } from '@/theme';
import { defineStyles, flexCenter, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type PasswordFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: ReactNode;
  description?: ReactNode;
  infoText?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  cssOverride?: CSSObject;
};

const PasswordField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  infoText,
  placeholder,
  disabled,
  cssOverride,
}: PasswordFieldProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();
  const [visible, setVisible] = useState(false);
  const fieldId = String(name);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined} cssOverride={cssOverride}>
          {label && (
            <FieldLabel htmlFor={fieldId} infoText={infoText}>
              {label}
            </FieldLabel>
          )}
          <div css={scoped(styles.wrapper)}>
            <Input
              {...field}
              id={fieldId}
              value={field.value ?? ''}
              type={visible ? 'text' : 'password'}
              placeholder={placeholder}
              disabled={disabled}
              error={Boolean(fieldState.error)}
              aria-invalid={fieldState.invalid}
              cssOverride={styles.input}
            />
            <button
              type="button"
              css={scoped(styles.toggle)}
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
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

PasswordField.displayName = 'PasswordField';

export default PasswordField;

const styles = defineStyles({
  wrapper: {
    position: 'relative',
    width: '100%',
  },
  input: {
    paddingRight: '40px',
  },
  toggle: {
    ...flexCenter(),
    position: 'absolute',
    top: '50%',
    right: theme.spacing[2],
    transform: 'translateY(-50%)',
    width: '28px',
    height: '28px',
    padding: 0,
    margin: 0,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    color: theme.colors.text.secondary,
    '&:hover, &:focus-visible': {
      color: theme.colors.text.primary,
      outline: 'none',
    },
  },
});
