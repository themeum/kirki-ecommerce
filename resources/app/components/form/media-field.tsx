import type { CSSObject } from '@emotion/react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Controller, type FieldPath, type FieldValues, useFormContext } from 'react-hook-form';

import MediaPicker from '@/components/media-picker';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';

type MediaFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: ReactNode;
  description?: ReactNode;
  infoText?: ReactNode;
  placeholder?: string;
  btnText?: string;
  size?: 'small' | 'fullWidth';
  accept?: AcceptedMediaTypes[];
  disabled?: boolean;
  cssOverride?: CSSObject;
};

const MediaField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  infoText,
  placeholder,
  btnText,
  size,
  accept,
  disabled,
  cssOverride,
}: MediaFieldProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();
  const [selectionError, setSelectionError] = useState<string | null>(null);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const errors = [
          fieldState.error,
          selectionError ? { message: selectionError } : undefined,
        ].filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

        return (
          <Field data-invalid={fieldState.invalid || Boolean(selectionError) || undefined} cssOverride={cssOverride}>
            {label && <FieldLabel infoText={infoText}>{label}</FieldLabel>}
            <MediaPicker
              value={field.value ?? null}
              onChange={(media) => {
                setSelectionError(null);
                field.onChange(media);
              }}
              onError={setSelectionError}
              placeholder={placeholder}
              btnText={btnText}
              size={size}
              accept={accept}
              disabled={disabled}
              error={fieldState.invalid || Boolean(selectionError)}
            />
            {description && <FieldDescription>{description}</FieldDescription>}
            <FieldError errors={errors} />
          </Field>
        );
      }}
    />
  );
};

MediaField.displayName = 'MediaField';

export default MediaField;
