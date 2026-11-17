import { useId } from 'react';

import Flex from '@/components/ui/flex';
import Label from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { AmountFormat } from '@/features/analytics/lib/layout';
import type { MoneyObject } from '@/features/analytics/schemas/catalog/analytics';
import { __, sprintf } from '@/wpi18n';

type AmountFormatOptionsProps = {
  label: string;
  value: AmountFormat;
  example?: MoneyObject | null;
  onChange: (value: AmountFormat) => void;
};

const AmountFormatOptions = (props: AmountFormatOptionsProps) => {
  const { label, value, example, onChange } = props;
  const id = useId();
  const options: { value: AmountFormat; label: string; example?: string }[] = [
    { value: 'short', label: __('Short', 'kirki-ecommerce'), example: example?.short_display },
    { value: 'long', label: __('Long', 'kirki-ecommerce'), example: example?.display },
  ];

  return (
    <RadioGroup
      value={value}
      onValueChange={(next) => onChange(next as AmountFormat)}
      aria-label={label}
    >
      {options.map((option) => (
        <Flex key={option.value} align="center" gap={2}>
          <RadioGroupItem value={option.value} id={`${id}-${option.value}`} />
          <Label htmlFor={`${id}-${option.value}`}>
            {option.example
              ? sprintf(
                  /* translators: 1: amount format name, 2: example amount in that format */
                  __('%1$s (%2$s)', 'kirki-ecommerce'),
                  option.label,
                  option.example,
                )
              : option.label}
          </Label>
        </Flex>
      ))}
    </RadioGroup>
  );
};

AmountFormatOptions.displayName = 'AmountFormatOptions';

export default AmountFormatOptions;
