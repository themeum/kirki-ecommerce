import {
  Field,
  FieldLabel,
} from '@/components/ui/field';
import Flex from '@/components/ui/flex';
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
      <Flex direction="column" gap={2}>
        {options.map((option) => (
          <Field orientation="horizontal" key={option.value}>
            <RadioGroupItem
              value={option.value}
              id={`radio-preview-${option.value}`}
            />
            <FieldLabel htmlFor={`radio-preview-${option.value}`}>
              {option.label}
            </FieldLabel>
          </Field>
        ))}
      </Flex>
    </RadioGroup>
  );
};

RadioGroupPreview.displayName = 'RadioGroupPreview';

export default RadioGroupPreview;
