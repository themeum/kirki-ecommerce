import type { CSSObject } from '@emotion/react';
import { X } from 'lucide-react';
import { type KeyboardEvent, type ReactNode, useState } from 'react';
import { Controller, type FieldPath, type FieldValues, useFormContext } from 'react-hook-form';

import Chip from '@/components/ui/chip';
import ChipField from '@/components/ui/chip-field';
import { chipFieldControlCss } from '@/components/ui/chip-field-styles';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import Input from '@/components/ui/input';

type ChipsInputFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: ReactNode;
  description?: ReactNode;
  infoText?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  cssOverride?: CSSObject;
  onCommit?: (next: string[]) => void;
};

const ChipsInputField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  infoText,
  placeholder,
  disabled,
  cssOverride,
  onCommit,
}: ChipsInputFieldProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();
  const [draft, setDraft] = useState('');
  const fieldId = String(name);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const chips: string[] = field.value ?? [];

        const commit = (next: string[]) => {
          field.onChange(next);
          onCommit?.(next);
        };

        const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
          if (event.key !== 'Enter') {
            return;
          }

          event.preventDefault();
          const value = draft.trim();

          if (!value || chips.includes(value)) {
            setDraft('');
            return;
          }

          setDraft('');
          commit([...chips, value]);
        };

        return (
          <Field
            data-invalid={fieldState.invalid || undefined}
            cssOverride={cssOverride}
          >
            {label && (
              <FieldLabel htmlFor={fieldId} infoText={infoText}>
                {label}
              </FieldLabel>
            )}
            <ChipField
              error={Boolean(fieldState.error)}
              disabled={disabled}
              control={
                <Input
                  id={fieldId}
                  value={draft}
                  placeholder={placeholder}
                  disabled={disabled}
                  cssOverride={chipFieldControlCss}
                  aria-invalid={fieldState.invalid}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleKeyDown}
                />
              }
              chips={
                chips.length > 0
                  ? chips.map((chip) => (
                    <Chip
                      key={chip}
                      text={chip}
                      closeIcon={<X size={14} aria-hidden="true" />}
                      onRemove={() =>
                        commit(chips.filter((item) => item !== chip))
                      }
                    />
                  ))
                  : undefined
              }
            />
            {description && <FieldDescription>{description}</FieldDescription>}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
};

ChipsInputField.displayName = 'ChipsInputField';

export default ChipsInputField;
