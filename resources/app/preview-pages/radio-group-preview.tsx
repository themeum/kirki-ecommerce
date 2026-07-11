import { RadioGroup } from '@/molecules/radio-group';
import type { SelectOption } from '@/types';

const RadioGroupPreview = () => {
  const optionsArray: SelectOption[] = [
    { value: 'item-1', title: 'Item 1' },
    { value: 'item-2', title: 'Item 2' },
    { value: 'item-3', title: 'Item 3' },
    { value: 'item-4', title: 'Item 4' },
  ];

  return (
    <div>
      <RadioGroup
        optionsArray={optionsArray}
        defaultValue="item-1"
        onChange={(selectedValue) => {
          console.log(selectedValue);
        }}
        type="checked"
      />
    </div>
  );
};

RadioGroupPreview.displayName = 'RadioGroupPreview';

export default RadioGroupPreview;
