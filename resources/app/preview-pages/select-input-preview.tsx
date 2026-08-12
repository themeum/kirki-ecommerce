import { useState } from 'react';

import SelectInput from '@/components/ui/select-input';
import type { SelectOption } from '@/types/components/common';

type SelectInputValue = {
  value?: string | number;
  unit?: string | number;
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

  const [currentValue, setCurrentValue] = useState<SelectInputValue>({
    value: '0',
    unit: 'px',
  });

  return (
    <SelectInput
      step={5}
      max={20}
      min={-11}
      label="Select Input"
      value={currentValue}
      optionsArray={optionsArray}
      onChange={setCurrentValue}
      error="There is an error"
    />
  );
};

SelectInputPreview.displayName = 'SelectInputPreview';

export default SelectInputPreview;
