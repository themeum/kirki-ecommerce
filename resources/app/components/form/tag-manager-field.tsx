import { type SerializedStyles } from '@emotion/react';
import type { ComponentProps, ReactNode } from 'react';
import {
  Controller,
  useFormContext,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';

import TagManager from '@/components/tag-manager/tag-manager';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';

type TagManagerProps = ComponentProps<typeof TagManager>;

type TagManagerFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: ReactNode;
  description?: ReactNode;
  css?: SerializedStyles;
  valueAs?: 'options' | 'strings';
} & Omit<
  TagManagerProps,
  | 'selectedTags'
  | 'onTagAdd'
  | 'onTagRemove'
  | 'onNewTagAdd'
  | 'label'
  | 'error'
  | 'helpText'
>;

const TagManagerField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  css,
  valueAs = 'options',
  ...tagManagerProps
}: TagManagerFieldProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const rawValue = Array.isArray(field.value) ? field.value : [];
        const selectedTags =
          valueAs === 'strings'
            ? rawValue.map((tag: string) => ({ title: tag, value: tag }))
            : rawValue;

        return (
          <Field data-invalid={fieldState.invalid || undefined} css={css}>
            {label && <FieldLabel>{label}</FieldLabel>}
            <TagManager
              {...tagManagerProps}
              selectedTags={selectedTags}
              onTagAdd={(tag) => {
                if (valueAs === 'strings') {
                  field.onChange([
                    String(tag.value),
                    ...rawValue.filter(
                      (item: string) => item !== String(tag.value),
                    ),
                  ]);
                  return;
                }
                field.onChange([...selectedTags, tag]);
              }}
              onNewTagAdd={(tagTitle) => {
                if (valueAs === 'strings') {
                  field.onChange([tagTitle, ...rawValue]);
                  return;
                }
                field.onChange([
                  { title: tagTitle, value: tagTitle },
                  ...selectedTags,
                ]);
              }}
              onTagRemove={(tag) => {
                if (valueAs === 'strings') {
                  field.onChange(
                    rawValue.filter(
                      (item: string) => item !== String(tag.value),
                    ),
                  );
                  return;
                }
                field.onChange(
                  selectedTags.filter(
                    (item: { value?: string | number }) =>
                      item.value !== tag.value,
                  ),
                );
              }}
              error={Boolean(fieldState.error)}
            />
            {description && <FieldDescription>{description}</FieldDescription>}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
};

TagManagerField.displayName = 'TagManagerField';

export default TagManagerField;
