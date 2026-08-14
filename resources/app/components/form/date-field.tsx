import type { CSSObject } from '@emotion/react';
import type { ReactNode } from 'react';
import { Controller, type ControllerRenderProps, type FieldPath, type FieldValues, useFormContext } from 'react-hook-form';

import {
  DatePicker,
  DateRangePicker,
  type DateRangePresetKey,
  type DateRangePresetsPosition,
  DateTimePicker,
  type HourCycle,
  TimePicker,
} from '@/components/ui/calendar';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';

type DateFieldMode = 'date' | 'range' | 'time' | 'datetime';

type DateFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  mode?: DateFieldMode;
  label?: ReactNode;
  description?: ReactNode;
  infoText?: ReactNode;
  placeholder?: string;
  displayFormat?: string;
  minDate?: string | null;
  maxDate?: string | null;
  numberOfMonths?: number;
  presets?: boolean | DateRangePresetKey[];
  presetsPosition?: DateRangePresetsPosition;
  hourCycle?: HourCycle;
  clearable?: boolean;
  disabled?: boolean;
  cssOverride?: CSSObject;
};

const DateField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  mode = 'date',
  label,
  description,
  infoText,
  placeholder,
  displayFormat,
  minDate,
  maxDate,
  numberOfMonths,
  presets,
  presetsPosition,
  hourCycle,
  clearable,
  disabled,
  cssOverride,
}: DateFieldProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();
  const fieldId = String(name);

  const readString = (value: unknown) => {
    if (typeof value !== 'string') {
      return '';
    }

    return value;
  };

  const renderPicker = (
    field: ControllerRenderProps<TFieldValues, TName>,
    error: boolean,
  ) => {
    const writeString = (nextValue: string | null) => {
      field.onChange(nextValue === '' ? null : nextValue);
    };

    if (mode === 'range') {
      return (
        <DateRangePicker
          id={fieldId}
          value={field.value ?? null}
          onChange={(nextValue) => field.onChange(nextValue ?? null)}
          placeholder={placeholder}
          displayFormat={displayFormat}
          minDate={minDate}
          maxDate={maxDate}
          numberOfMonths={numberOfMonths}
          presets={presets}
          presetsPosition={presetsPosition}
          clearable={clearable}
          disabled={disabled}
          error={error}
        />
      );
    }

    if (mode === 'time') {
      return (
        <TimePicker
          id={fieldId}
          value={readString(field.value)}
          onChange={writeString}
          hourCycle={hourCycle}
          disabled={disabled}
          error={error}
        />
      );
    }

    if (mode === 'datetime') {
      return (
        <DateTimePicker
          id={fieldId}
          value={readString(field.value)}
          onChange={writeString}
          placeholder={placeholder}
          displayFormat={displayFormat}
          minDate={minDate}
          maxDate={maxDate}
          hourCycle={hourCycle}
          clearable={clearable}
          disabled={disabled}
          error={error}
        />
      );
    }

    return (
      <DatePicker
        id={fieldId}
        value={readString(field.value)}
        onChange={writeString}
        placeholder={placeholder}
        displayFormat={displayFormat}
        minDate={minDate}
        maxDate={maxDate}
        clearable={clearable}
        disabled={disabled}
        error={error}
      />
    );
  };

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
          {renderPicker(field, Boolean(fieldState.error))}
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

DateField.displayName = 'DateField';

export default DateField;
export type { DateFieldMode, DateFieldProps };
