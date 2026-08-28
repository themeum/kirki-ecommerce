import { type ComponentPropsWithoutRef, forwardRef, type KeyboardEvent, type WheelEvent } from 'react';

import Input from '@/components/ui/input';

type NumberInputProps = Omit<ComponentPropsWithoutRef<typeof Input>, 'type'>;

const preventStepKeys = (event: KeyboardEvent<HTMLInputElement>) => {
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault();
  }
};

const preventStepScroll = (event: WheelEvent<HTMLInputElement>) => {
  event.currentTarget.blur();
};

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>((props, ref) => {
  return (
    <Input
      {...props}
      ref={ref}
      type="number"
      onKeyDown={preventStepKeys}
      onWheel={preventStepScroll}
    />
  );
});

NumberInput.displayName = 'NumberInput';

export default NumberInput;
