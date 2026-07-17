import Flex from '@/molecules/flex';

import Label from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const UiRadioGroupPreview = () => {
  return (
    <RadioGroup defaultValue="option-1">
      <Flex direction="column" gap={12}>
        <Flex gap={8} style={{ alignItems: 'center' }}>
          <RadioGroupItem value="option-1" id="ui-radio-1" />
          <Label htmlFor="ui-radio-1">Option 1</Label>
        </Flex>
        <Flex gap={8} style={{ alignItems: 'center' }}>
          <RadioGroupItem value="option-2" id="ui-radio-2" />
          <Label htmlFor="ui-radio-2">Option 2</Label>
        </Flex>
        <Flex gap={8} style={{ alignItems: 'center' }}>
          <RadioGroupItem value="option-3" id="ui-radio-3" disabled />
          <Label htmlFor="ui-radio-3">Option 3 (disabled)</Label>
        </Flex>
      </Flex>
    </RadioGroup>
  );
};

UiRadioGroupPreview.displayName = 'UiRadioGroupPreview';

export default UiRadioGroupPreview;
