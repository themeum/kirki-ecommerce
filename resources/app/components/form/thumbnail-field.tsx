import type { CSSObject } from '@emotion/react';
import type { ComponentProps, ReactNode } from 'react';
import { Controller, type FieldPath, type FieldValues, useFormContext } from 'react-hook-form';

import ThumbnailSelector from '@/components/thumbnail-selector';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import type { MediaRef } from '@/types';

type MediaItem = Omit<MediaRef, 'id'> & {
  id?: string | number;
};

type ThumbnailFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: ReactNode;
  description?: ReactNode;
  cssOverride?: CSSObject;
  infoText?: ReactNode;
  placeholder?: string;
  btnText?: string;
  size?: ComponentProps<typeof ThumbnailSelector>['size'];
  valueAs?: 'object' | 'id';
  previewUrl?: string | null;
  onPreviewChange?: (url: string | null) => void;
  getPreviewUrl?: (value: unknown) => string | undefined;
};

const ThumbnailField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  cssOverride,
  infoText,
  placeholder,
  btnText,
  size,
  valueAs = 'object',
  previewUrl,
  onPreviewChange,
  getPreviewUrl,
}: ThumbnailFieldProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const resolvedPreview =
          previewUrl ??
          getPreviewUrl?.(field.value) ??
          (typeof field.value === 'object' &&
            field.value !== null &&
            'url' in field.value
            ? String((field.value as unknown as MediaItem).url ?? '')
            : typeof field.value === 'string' && valueAs === 'object'
              ? field.value
              : undefined);

        return (
          <Field data-invalid={fieldState.invalid || undefined} cssOverride={cssOverride}>
            {label && <FieldLabel infoText={infoText}>{label}</FieldLabel>}
            <ThumbnailSelector
              src={resolvedPreview || undefined}
              placeholder={placeholder}
              btnText={btnText}
              size={size}
              error={Boolean(fieldState.error)}
              onChange={(media) => {
                const item = Array.isArray(media) ? media[0] : media;
                onPreviewChange?.(item?.url ?? null);
                if (valueAs === 'id') {
                  field.onChange(item?.id ?? null);
                  return;
                }
                field.onChange(item ?? null);
              }}
            />
            {description && <FieldDescription>{description}</FieldDescription>}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
};

ThumbnailField.displayName = 'ThumbnailField';

export default ThumbnailField;
