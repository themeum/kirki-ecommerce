import Flex from '@/molecules/flex';

import Label from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const UiSelectPreview = () => {
  return (
    <Flex direction="column" gap={12} style={{ maxWidth: 240 }}>
      <div>
        <Label>Default</Label>
        <Select defaultValue="apple">
          <SelectTrigger>
            <SelectValue placeholder="Select a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
            <SelectItem value="orange">Orange</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label error>With error</Label>
        <Select>
          <SelectTrigger error>
            <SelectValue placeholder="Select a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </Flex>
  );
};

UiSelectPreview.displayName = 'UiSelectPreview';

export default UiSelectPreview;
