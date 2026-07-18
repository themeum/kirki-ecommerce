import Flex from '@/molecules/flex';

import Input from '@/components/ui/input';
import Label from '@/components/ui/label';

const UiInputPreview = () => {
  return (
    <Flex direction="column" gap={12} style={{ maxWidth: 320 }}>
      <div>
        <Label htmlFor="ui-input-default">Default</Label>
        <Input id="ui-input-default" placeholder="Enter text" />
      </div>
      <div>
        <Label htmlFor="ui-input-error" error>
          With error
        </Label>
        <Input id="ui-input-error" placeholder="Invalid value" error />
      </div>
      <div>
        <Label htmlFor="ui-input-disabled">Disabled</Label>
        <Input id="ui-input-disabled" placeholder="Disabled" disabled />
      </div>
    </Flex>
  );
};

UiInputPreview.displayName = 'UiInputPreview';

export default UiInputPreview;
