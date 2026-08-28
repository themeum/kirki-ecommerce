import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { MinusIcon, PlusIcon } from '@/icons';
import { defineStyles } from '@/theme/mixins';

type QuantityStepperProps = {
  value: number;
  min?: number;
  onChange: (value: number) => void;
};

const QuantityStepper = ({ value, min = 1, onChange }: QuantityStepperProps) => {
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
          onChange(Number.isNaN(nextValue) ? min : Math.max(min, nextValue));
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
        onClick={() => onChange(value + 1)}
        aria-label="Increase quantity"
      >
        <PlusIcon />
      </InputGroupButton>
    </InputGroup>
  );
};

QuantityStepper.displayName = 'QuantityStepper';

export default QuantityStepper;

const styles = defineStyles({
  group: {
    width: '104px',
  },
  input: {
    textAlign: 'center',
    paddingInline: 0,
  },
});
