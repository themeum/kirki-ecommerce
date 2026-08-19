import type { CSSObject } from '@emotion/react';
import { Fragment, type ReactNode } from 'react';
import {
  Controller,
  type FieldPath,
  type FieldValues,
  useFormContext,
} from 'react-hook-form';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';

type UnitAmountFieldOption = {
  value: string;
  label: string;
  endSlot?: ReactNode;
};

type UnitAmountFieldGroup = {
  heading: string;
  icon?: ReactNode;
  items: UnitAmountFieldOption[];
};

type UnitAmountFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  unitName: TName;
  unitOptions: UnitAmountFieldOption[] | UnitAmountFieldGroup[];
  label?: ReactNode;
  description?: ReactNode;
  infoText?: ReactNode;
  placeholder?: string;
  unitShortText?: (value: unknown) => ReactNode;
  onUnitChange?: (value: string) => void;
  disabled?: boolean;
  cssOverride?: CSSObject;
};

const isGrouped = (
  options: UnitAmountFieldOption[] | UnitAmountFieldGroup[],
): options is UnitAmountFieldGroup[] => {
  return options.length > 0 && 'items' in options[0];
};

const UnitAmountField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  unitName,
  unitOptions,
  label,
  description,
  infoText,
  placeholder,
  unitShortText,
  onUnitChange,
  disabled,
  cssOverride,
}: UnitAmountFieldProps<TFieldValues, TName>) => {
  const { control, clearErrors } = useFormContext<TFieldValues>();
  const fieldId = String(name);
  const unitFieldId = String(unitName);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: amountField, fieldState: amountState }) => (
        <Controller
          control={control}
          name={unitName}
          render={({ field: unitField, fieldState: unitState }) => {
            const hasError =
              Boolean(amountState.error) || Boolean(unitState.error);

            const handleUnitChange = (nextUnit: string) => {
              unitField.onChange(nextUnit);
              onUnitChange?.(nextUnit);
            };

            return (
              <Field
                data-invalid={hasError || undefined}
                cssOverride={cssOverride}
              >
                {label && (
                  <FieldLabel htmlFor={fieldId} infoText={infoText}>
                    {label}
                  </FieldLabel>
                )}
                <InputGroup error={hasError} disabled={disabled}>
                  <InputGroupInput
                    id={fieldId}
                    type="number"
                    min={0}
                    placeholder={placeholder}
                    value={amountField.value ?? ''}
                    onChange={(event) => {
                      amountField.onChange(event.target.value);
                      clearErrors([name, unitName]);
                    }}
                    onBlur={amountField.onBlur}
                    disabled={disabled}
                    aria-invalid={amountState.invalid}
                  />
                  <InputGroupAddon align="inline-end">
                    <Select
                      value={unitField.value ?? ''}
                      onValueChange={handleUnitChange}
                      disabled={disabled}
                    >
                      <SelectTrigger
                        id={unitFieldId}
                        variant="invisible"
                        aria-invalid={unitState.invalid}
                        cssOverride={styles.unitTrigger}
                      >
                        <SelectValue>
                          {unitShortText
                            ? unitShortText(unitField.value)
                            : undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {isGrouped(unitOptions)
                          ? unitOptions.map((group, index) => (
                            <Fragment key={group.heading}>
                              {index > 0 && <SelectSeparator />}
                              <SelectGroup>
                                <SelectLabel icon={group.icon}>
                                  {group.heading}
                                </SelectLabel>
                                {group.items.map((item) => (
                                  <SelectItem
                                    key={item.value}
                                    value={item.value}
                                    endSlot={item.endSlot}
                                  >
                                    {item.label}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </Fragment>
                          ))
                          : unitOptions.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                              endSlot={option.endSlot}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </InputGroupAddon>
                </InputGroup>
                {description && (
                  <FieldDescription>{description}</FieldDescription>
                )}
                {hasError && (
                  <FieldError errors={[amountState.error, unitState.error]} />
                )}
              </Field>
            );
          }}
        />
      )}
    />
  );
};

UnitAmountField.displayName = 'UnitAmountField';

export default UnitAmountField;
export type { UnitAmountFieldGroup, UnitAmountFieldOption };

const styles = defineStyles({
  unitTrigger: {
    width: 'auto',
    minWidth: '64px',
    paddingRight: theme.spacing[2],
  },
});
