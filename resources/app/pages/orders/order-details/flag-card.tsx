import { X } from 'lucide-react';
import { type KeyboardEvent, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { Card, CardContent } from '@/components/ui/card';
import Chip from '@/components/ui/chip';
import ChipField from '@/components/ui/chip-field';
import { chipFieldControlCss } from '@/components/ui/chip-field-styles';
import { Field, FieldLabel } from '@/components/ui/field';
import Input from '@/components/ui/input';
import { cardStyles } from '@/theme/card-styles';
import type { OrderFormInput } from '@/types';
import { __ } from '@/wpi18n';

type FlagCardProps = {
  onSave: () => void;
};

const FlagCard = ({ onSave }: FlagCardProps) => {
  const [draft, setDraft] = useState('');
  const { control } = useFormContext<OrderFormInput>();

  return (
    <Card cssOverride={cardStyles.formCard}>
      <CardContent>
        <Controller
          control={control}
          name="flags"
          render={({ field }) => {
            const flags = field.value ?? [];

            const commit = (next: string[]) => {
              field.onChange(next);
              onSave();
            };

            const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
              if (event.key !== 'Enter') {
                return;
              }

              event.preventDefault();
              const value = draft.trim();

              if (!value || flags.includes(value)) {
                setDraft('');
                return;
              }

              setDraft('');
              commit([...flags, value]);
            };

            return (
              <Field>
                <FieldLabel>{__('Flag', 'kirki-ecommerce')}</FieldLabel>
                <ChipField
                  control={
                    <Input
                      value={draft}
                      placeholder={__('i.e Backorder, Urgent', 'kirki-ecommerce')}
                      cssOverride={chipFieldControlCss}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                  }
                  chips={
                    flags.length > 0
                      ? flags.map((flag) => (
                        <Chip
                          key={flag}
                          text={flag}
                          closeIcon={<X size={14} aria-hidden="true" />}
                          onRemove={() =>
                            commit(flags.filter((item) => item !== flag))
                          }
                        />
                      ))
                      : undefined
                  }
                />
              </Field>
            );
          }}
        />
      </CardContent>
    </Card>
  );
};

FlagCard.displayName = 'FlagCard';

export default FlagCard;
