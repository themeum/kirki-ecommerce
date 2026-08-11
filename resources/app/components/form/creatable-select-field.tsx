import type { CSSObject } from '@emotion/react';
import type { ReactNode } from 'react';
import { Controller, useFormContext, type FieldPath, type FieldValues } from 'react-hook-form';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircleIcon } from '@/icons';

const ADD_NEW_VALUE = '__add_new__';

type CreatableSelectFieldOption = {
  label: string;
  value: string | number;
};

type CreatableSelectFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: ReactNode;
  description?: ReactNode;
  infoText?: ReactNode;
  placeholder?: string;
  options: CreatableSelectFieldOption[];
  addNewLabel?: string;
  onCreateNew?: () => void;
  valueAsNumber?: boolean;
  disabled?: boolean;
  cssOverride?: CSSObject;
};

const CreatableSelectField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  infoText,
  placeholder,
  options,
  addNewLabel,
  onCreateNew,
  valueAsNumber = false,
  disabled,
  cssOverride,
}: CreatableSelectFieldProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();
  const fieldId = String(name);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field
          data-invalid={fieldState.invalid || undefined}
          cssOverride={cssOverride}
        >
          {label && (
            <FieldLabel htmlFor={fieldId} infoText={infoText}>
              {label}
            </FieldLabel>
          )}
          <Select
            value={
              field.value === null || field.value === undefined
                ? ''
                : String(field.value)
            }
            onValueChange={(nextValue) => {
              if (nextValue === ADD_NEW_VALUE) {
                onCreateNew?.();
                return;
              }
              if (nextValue === '') {
                field.onChange(null);
                return;
              }
              field.onChange(
                valueAsNumber ? Number(nextValue) : nextValue,
              );
            }}
            disabled={disabled}
          >
            <SelectTrigger
              id={fieldId}
              error={Boolean(fieldState.error)}
              aria-invalid={fieldState.invalid}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {onCreateNew && addNewLabel && (
                <SelectItem value={ADD_NEW_VALUE}>
                  <Flex gap={2} align="center">
                    <PlusCircleIcon />
                    {addNewLabel}
                  </Flex>
                </SelectItem>
              )}
              {onCreateNew && addNewLabel && options.length > 0 && (
                <SelectSeparator />
              )}
              {options.map((option) => (
                <SelectItem
                  key={String(option.value)}
                  value={String(option.value)}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

CreatableSelectField.displayName = 'CreatableSelectField';

export default CreatableSelectField;
