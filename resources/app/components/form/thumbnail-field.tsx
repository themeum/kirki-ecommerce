import type { ComponentProps, ReactNode } from 'react';
import {
  useFormContext,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';

import ThumbnailSelector from '@/components/thumbnail-selector';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
  className?: string;
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
  className,
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
    <FormField
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
          <FormItem className={className}>
            {label && <FormLabel>{label}</FormLabel>}
            <FormControl>
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
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};

ThumbnailField.displayName = 'ThumbnailField';

export default ThumbnailField;
