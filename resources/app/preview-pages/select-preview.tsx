import { useState } from 'react';

import Combobox from '@/components/ui/combobox';
import Flex from '@/components/ui/flex';
import Label from '@/components/ui/label';

const options = [
  { label: 'Fruit 1 blablablablabalblaBLAblablabla', value: 'fruit-1' },
  { label: 'Fruit 2', value: 'fruit-2' },
  { label: 'Fruit 3', value: 'fruit-3' },
  { label: 'Fruit 4', value: 'fruit-4' },
  { label: 'Fruit 5', value: 'fruit-5' },
  { label: 'Fruit 6', value: 'fruit-6' },
  { label: 'Fruit 7', value: 'fruit-7' },
  { label: 'Fruit 8', value: 'fruit-8' },
  { label: 'Fruit 9', value: 'fruit-9' },
  { label: 'Fruit 10', value: 'fruit-10' },
  { label: 'Fruit 11', value: 'fruit-11' },
  { label: 'Fruit 12', value: 'fruit-12' },
  { label: 'Fruit 13', value: 'fruit-13' },
  { label: 'Fruit 14', value: 'fruit-14' },
  { label: 'Fruit 15', value: 'fruit-15' },
];

const SelectPreview = () => {
  const [multipleValue, setMultipleValue] = useState<string[]>([]);
  const [singleValue, setSingleValue] = useState<string>('');

  const handleMultipleValueChange = (nextValue: string | string[]) => {
    console.log(nextValue);
    setMultipleValue(Array.isArray(nextValue) ? nextValue : [nextValue]);
  };

  const handleSingleValueChange = (nextValue: string | string[]) => {
    console.log(nextValue);
    setSingleValue(Array.isArray(nextValue) ? nextValue[0] : nextValue);
  };

  return (
    <>
      <div style={{ width: '200px' }}>
        <Flex direction="column" gap={8}>
          <Label>Select dropdown 1</Label>
          <Combobox
            options={options}
            value={multipleValue}
            onChange={handleMultipleValueChange}
            multiple
          />
        </Flex>
      </div>
      <div>
        <Flex direction="column" gap={8}>
          <Label>Select dropdown 2</Label>
          <Combobox
            options={options}
            value={singleValue}
            onChange={handleSingleValueChange}
          />
        </Flex>
      </div>
    </>
  );
};

SelectPreview.displayName = 'SelectPreview';

export default SelectPreview;
