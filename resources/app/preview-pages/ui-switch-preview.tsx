import Flex from '@/components/ui/flex';
import Label from '@/components/ui/label';
import Switch from '@/components/ui/switch';

const UiSwitchPreview = () => {
  return (
    <Flex direction="column" gap={3}>
      <Flex gap={2} align="center">
        <Switch id="ui-switch-1" defaultChecked />
        <Label htmlFor="ui-switch-1">On</Label>
      </Flex>
      <Flex gap={2} align="center">
        <Switch id="ui-switch-2" />
        <Label htmlFor="ui-switch-2">Off</Label>
      </Flex>
      <Flex gap={2} align="center">
        <Switch id="ui-switch-3" disabled />
        <Label htmlFor="ui-switch-3">Disabled</Label>
      </Flex>
    </Flex>
  );
};

UiSwitchPreview.displayName = 'UiSwitchPreview';

export default UiSwitchPreview;
