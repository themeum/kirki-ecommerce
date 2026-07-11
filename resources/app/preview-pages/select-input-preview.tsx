import { useState, type ComponentProps } from 'react';

import SelectInput from '@/molecules/select-input';
import type { SelectOption } from '@/types';

type SelectInputValue = {
  value?: string | number;
  unit?: string | number;
};

type SelectInputPreviewProps = ComponentProps<typeof SelectInput> & {
  placeholder?: string;
  onClose?: () => void;
};

const SelectInputPreview = () => {
  const optionsArray: SelectOption[] = [
    { value: 'px', title: 'px', fallback: true },
    { value: 'rem', title: 'rem' },
    { value: 'em', title: 'em' },
    { value: 'vw', title: 'vw' },
    { value: 'vh', title: 'vh' },
    { value: 'vmin', title: 'vmin' },
    { value: 'vmax', title: 'vmax' },
    { value: 'fr', title: 'fr' },
    { value: 'mm', title: 'mm' },
  ];
  const defaultValue: SelectInputValue = {
    value: '33',
    unit: 'px',
  };
  const initialValue: SelectInputValue = {
    value: '0',
    unit: 'px',
  };

  const [currentValue, setCurrentValue] = useState<SelectInputValue>(
    initialValue || defaultValue,
  );

  const handleChange = (nextValue: SelectInputValue) => {
    setCurrentValue(nextValue);
    console.log(nextValue, 'value changed');
  };

  return (
    <SelectInput
      {...({
        step: 5,
        max: 20,
        min: -11,
        label: 'Select Input',
        value: currentValue,
        placeholder: 'Select',
        optionsArray: optionsArray,
        onChange: (nextValue: SelectInputValue) => {
          handleChange(nextValue);
        },
        onClose: () => {
          console.log('dropdown closed');
        },
        error: 'There is an error',
      } satisfies SelectInputPreviewProps)}
    />
  );
};

SelectInputPreview.displayName = 'SelectInputPreview';

export default SelectInputPreview;
