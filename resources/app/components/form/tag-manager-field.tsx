import type { ComponentProps, ReactNode } from 'react';
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
import TagManager from '@/molecules/tag-manager/tag-manager';

type TagManagerProps = ComponentProps<typeof TagManager>;

type TagManagerFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: ReactNode;
  description?: ReactNode;
  className?: string;
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
  className,
  valueAs = 'options',
  ...tagManagerProps
}: TagManagerFieldProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const rawValue = Array.isArray(field.value) ? field.value : [];
        const selectedTags =
          valueAs === 'strings'
            ? rawValue.map((tag: string) => ({ title: tag, value: tag }))
            : rawValue;

        return (
          <FormItem className={className}>
            {label && <FormLabel>{label}</FormLabel>}
            <FormControl>
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
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};

TagManagerField.displayName = 'TagManagerField';

export default TagManagerField;
