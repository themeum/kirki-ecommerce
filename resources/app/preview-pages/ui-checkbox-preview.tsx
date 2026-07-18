import Flex from '@/molecules/flex';

import Checkbox from '@/components/ui/checkbox';
import Label from '@/components/ui/label';

const UiCheckboxPreview = () => {
  return (
    <Flex direction="column" gap={12}>
      <Flex gap={8} style={{ alignItems: 'center' }}>
        <Checkbox id="ui-checkbox-1" defaultChecked />
        <Label htmlFor="ui-checkbox-1">Checked</Label>
      </Flex>
      <Flex gap={8} style={{ alignItems: 'center' }}>
        <Checkbox id="ui-checkbox-2" />
        <Label htmlFor="ui-checkbox-2">Unchecked</Label>
      </Flex>
      <Flex gap={8} style={{ alignItems: 'center' }}>
        <Checkbox id="ui-checkbox-3" disabled />
        <Label htmlFor="ui-checkbox-3">Disabled</Label>
      </Flex>
    </Flex>
  );
};

UiCheckboxPreview.displayName = 'UiCheckboxPreview';

export default UiCheckboxPreview;
