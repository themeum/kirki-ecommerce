import type { CSSObject } from '@emotion/react';
import type { ReactNode } from 'react';
import { Controller, type FieldPath, type FieldValues, useFormContext } from 'react-hook-form';

import GroupTagTable from '@/components/group-tag-table';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { groupDetails, optionsList, requiredFields } from '@/features/products/lib/seo-settings/utils';
import type { SelectOption } from '@/types/components/common';
import { __ } from '@/wpi18n';

type SchemaPropertyFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: ReactNode;
  description?: ReactNode;
  infoText?: ReactNode;
  cssOverride?: CSSObject;
};

const SchemaPropertyField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  infoText,
  cssOverride,
}: SchemaPropertyFieldProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined} cssOverride={cssOverride}>
          {label && <FieldLabel infoText={infoText}>{label}</FieldLabel>}
          <GroupTagTable
            groupDetails={groupDetails}
            optionsArray={optionsList as SelectOption[]}
            requiredFields={requiredFields}
            hasSelect
            isEditable
            selectedValues={field.value}
            onChange={(value) => field.onChange(value)}
            placeholder={__('Type to add properties', 'kirki-ecommerce')}
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

SchemaPropertyField.displayName = 'SchemaPropertyField';

export default SchemaPropertyField;
