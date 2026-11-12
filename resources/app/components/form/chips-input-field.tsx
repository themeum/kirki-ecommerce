import type { CSSObject } from '@emotion/react';
import { X } from 'lucide-react';
import { type KeyboardEvent, type ReactNode, useState } from 'react';
import { Controller, type FieldPath, type FieldValues, useFormContext } from 'react-hook-form';

import Chip from '@/components/ui/chip/chip';
import ChipInput from '@/components/ui/chip/chip-input';
import { chipsInputControlCss } from '@/components/ui/chip/chip-input-styles';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import Input from '@/components/ui/input';
import { __ } from '@/wpi18n';

type ChipsInputFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: ReactNode;
  description?: ReactNode;
  infoText?: ReactNode;
  placeholder?: string;
  selectedPlaceholder?: string;
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
  selectedPlaceholder = __('Add more', 'kirki-ecommerce'),
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
          <Field data-invalid={fieldState.invalid || undefined} cssOverride={cssOverride}>
            {label && (
              <FieldLabel htmlFor={fieldId} infoText={infoText}>
                {label}
              </FieldLabel>
            )}
            <ChipInput
              error={Boolean(fieldState.error)}
              disabled={disabled}
              maxVisibleRows={2}
              control={
                <Input
                  id={fieldId}
                  value={draft}
                  placeholder={chips.length > 0 ? selectedPlaceholder : placeholder}
                  disabled={disabled}
                  cssOverride={chipsInputControlCss}
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
                        closeIcon={<X size={12} aria-hidden="true" />}
                        onRemove={() => commit(chips.filter((item) => item !== chip))}
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
