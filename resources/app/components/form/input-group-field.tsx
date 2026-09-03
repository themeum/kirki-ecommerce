import type { CSSObject } from '@emotion/react';
import type { ChangeEvent, ComponentPropsWithoutRef, FocusEvent, ReactNode } from 'react';
import {
  Controller,
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
  useFormContext,
} from 'react-hook-form';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  type InputGroupInputProps,
  InputGroupTextarea,
  type InputGroupTextareaProps,
} from '@/components/ui/input-group';
import { theme } from '@/theme';
import { defineStyles, mergeCss } from '@/theme/mixins';
import { clampValue } from '@/utils/number';

type InputGroupFieldRenderArg<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = {
  field: ControllerRenderProps<TFieldValues, TName>;
  fieldState: ControllerFieldState;
  id: string;
  invalid: boolean;
};

type InputGroupFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: ReactNode;
  description?: ReactNode;
  infoText?: ReactNode;
  cssOverride?: CSSObject;
  showError?: boolean;
  multiline?: boolean;
  type?: ComponentPropsWithoutRef<'input'>['type'];
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  rows?: number;
  min?: number | null;
  max?: number | null;
  step?: number;
  inputMode?: ComponentPropsWithoutRef<'input'>['inputMode'];
  inputProps?: Partial<Omit<InputGroupInputProps, 'value' | 'onChange'>>;
  textareaProps?: Partial<Omit<InputGroupTextareaProps, 'value' | 'onChange'>>;
  onValueChange?: (value: string | number | undefined) => void;
  startContent?: ReactNode;
  endContent?: ReactNode;
  blockStartContent?: ReactNode;
  blockEndContent?: ReactNode;
  children?: (arg: InputGroupFieldRenderArg<TFieldValues, TName>) => ReactNode;
  inputCssOverride?: CSSObject;
  contentCssOverride?: CSSObject;
  blockCssOverride?: CSSObject;
};

const InputGroupField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  infoText,
  cssOverride,
  showError = true,
  multiline = false,
  type = 'text',
  placeholder,
  disabled,
  readOnly,
  rows = 5,
  min,
  max,
  step,
  inputMode,
  inputProps,
  textareaProps,
  onValueChange,
  startContent,
  endContent,
  blockStartContent,
  blockEndContent,
  children,
  inputCssOverride,
  contentCssOverride,
  blockCssOverride,
}: InputGroupFieldProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();
  const id = String(name);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
          const raw = event.target.value;
          const next =
            type === 'number' && !multiline ? (raw === '' ? undefined : Number(raw)) : raw;
          field.onChange(next);
          onValueChange?.(next);
        };

        const handleNumberBlur = (event: FocusEvent<HTMLInputElement>) => {
          field.onBlur();

          const entered = Number(event.target.value);

          if (event.target.value === '' || Number.isNaN(entered)) {
            return;
          }

          const clamped = clampValue(entered, min, max);

          if (clamped !== entered) {
            field.onChange(clamped);
            onValueChange?.(clamped);
          }
        };

        return (
          <Field data-invalid={fieldState.invalid || undefined} cssOverride={cssOverride}>
            {label && (
              <FieldLabel htmlFor={id} infoText={infoText}>
                {label}
              </FieldLabel>
            )}
            <InputGroup error={fieldState.invalid} disabled={disabled}>
              {children ? (
                children({ field, fieldState, id, invalid: fieldState.invalid })
              ) : (
                <>
                  {blockStartContent && (
                    <InputGroupAddon align="block-start" cssOverride={blockCssOverride}>
                      {blockStartContent}
                    </InputGroupAddon>
                  )}
                  {startContent && (
                    <InputGroupAddon
                      align="inline-start"
                      cssOverride={mergeCss(styles.content, contentCssOverride)}
                    >
                      {startContent}
                    </InputGroupAddon>
                  )}
                  {multiline ? (
                    <InputGroupTextarea
                      id={id}
                      name={field.name}
                      ref={field.ref}
                      rows={rows}
                      value={field.value ?? ''}
                      placeholder={placeholder}
                      disabled={disabled}
                      readOnly={readOnly}
                      aria-invalid={fieldState.invalid}
                      onChange={handleChange}
                      onBlur={field.onBlur}
                      cssOverride={inputCssOverride}
                      {...textareaProps}
                    />
                  ) : (
                    <InputGroupInput
                      id={id}
                      name={field.name}
                      ref={field.ref}
                      type={type}
                      value={field.value ?? ''}
                      placeholder={placeholder}
                      disabled={disabled}
                      readOnly={readOnly}
                      step={step}
                      inputMode={inputMode}
                      aria-invalid={fieldState.invalid}
                      onChange={handleChange}
                      onBlur={type === 'number' ? handleNumberBlur : field.onBlur}
                      cssOverride={inputCssOverride}
                      {...inputProps}
                    />
                  )}
                  {endContent && (
                    <InputGroupAddon
                      align="inline-end"
                      cssOverride={mergeCss(styles.content, contentCssOverride)}
                    >
                      {endContent}
                    </InputGroupAddon>
                  )}
                  {blockEndContent && (
                    <InputGroupAddon align="block-end" cssOverride={blockCssOverride}>
                      {blockEndContent}
                    </InputGroupAddon>
                  )}
                </>
              )}
            </InputGroup>
            {description && <FieldDescription>{description}</FieldDescription>}
            {fieldState.invalid && showError && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
};

InputGroupField.displayName = 'InputGroupField';

export default InputGroupField;
export type { InputGroupFieldProps };

const styles = defineStyles({
  content: {
    padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
  },
});
