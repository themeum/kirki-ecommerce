import Flex from '@/components/ui/flex';
import { FormFieldRow } from '@/components/ui/form';
import Label from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const RadioGroupPreview = () => {
  const options = [
    { value: 'item-1', label: 'Item 1' },
    { value: 'item-2', label: 'Item 2' },
    { value: 'item-3', label: 'Item 3' },
    { value: 'item-4', label: 'Item 4' },
  ];

  return (
    <RadioGroup
      defaultValue="item-1"
      onValueChange={(selectedValue) => {
        console.log(selectedValue);
      }}
    >
      <Flex direction="column" gap={8}>
        {options.map((option) => (
          <FormFieldRow key={option.value}>
            <RadioGroupItem
              value={option.value}
              id={`radio-preview-${option.value}`}
            />
            <Label htmlFor={`radio-preview-${option.value}`}>
              {option.label}
            </Label>
          </FormFieldRow>
        ))}
      </Flex>
    </RadioGroup>
  );
};

RadioGroupPreview.displayName = 'RadioGroupPreview';

export default RadioGroupPreview;
