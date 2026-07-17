import Flex from '@/molecules/flex';

import Label from '@/components/ui/label';

const UiLabelPreview = () => {
  return (
    <Flex direction="column" gap={12}>
      <Label>Default label</Label>
      <Label helpText="This is help text">With help</Label>
      <Label infoText="This is info text">With info</Label>
      <Label error>Error label</Label>
    </Flex>
  );
};

UiLabelPreview.displayName = 'UiLabelPreview';

export default UiLabelPreview;
