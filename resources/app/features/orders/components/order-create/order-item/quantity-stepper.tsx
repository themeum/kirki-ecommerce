import { PlusIcon } from 'lucide-react';

import { InputGroup, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { MinusIcon } from '@/icons/common';
import { defineStyles } from '@/theme/mixins';
import { dispatchToastMessage } from '@/utils/common';
import { __ } from '@/wpi18n';

type QuantityStepperProps = {
  value: number;
  min?: number;
  max?: number;
  disabledMessage?: string;
  onChange: (value: number) => void;
};

const QuantityStepper = ({
  value,
  min = 1,
  max,
  disabledMessage,
  onChange,
}: QuantityStepperProps) => {
  const isDefined = typeof max === 'number';
  const isAtMax = isDefined && value >= max;

  return (
    <InputGroup cssOverride={styles.group}>
      <InputGroupButton
        size="icon-xs"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="Decrease quantity"
      >
        <MinusIcon />
      </InputGroupButton>
      <InputGroupInput
        type="number"
        value={value}
        onChange={(event) => {
          const nextValue = Number(event.target.value);
          const clamped = Number.isNaN(nextValue) ? min : Math.max(min, nextValue);
          onChange(isDefined ? Math.min(max, clamped) : clamped);
        }}
        onWheel={(event) => {
          event.currentTarget.blur();
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault();
          }
        }}
        cssOverride={styles.input}
      />
      <InputGroupButton
        size="icon-xs"
        aria-disabled={isAtMax || undefined}
        cssOverride={isAtMax ? styles.disabledLook : undefined}
        onClick={() => {
          if (isAtMax) {
            dispatchToastMessage('warning', {
              title: disabledMessage ?? __('Maximum quantity reached', 'kirki-ecommerce'),
            });
            return;
          }

          onChange(value + 1);
        }}
        aria-label="Increase quantity"
      >
        <PlusIcon size={16} />
      </InputGroupButton>
    </InputGroup>
  );
};

QuantityStepper.displayName = 'QuantityStepper';

export default QuantityStepper;

const styles = defineStyles({
  group: {
    width: '88px',
  },
  input: {
    textAlign: 'center',
    paddingInline: 0,
  },
  disabledLook: {
    opacity: 0.5,
  },
});
