import Button from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowDownUp, ListFilter } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Flex from '@/molecules/flex';
import Label from '@/molecules/label';
import Searchbox from '@/components/ui/searchbox';
import { __ } from '@/wpi18n';

const ActionGroupPreview = () => {
  return (
    <Flex>
      <Label text="This is a random text" />
      <ActionGroup>
        <Select disabled>
          <SelectTrigger style={{ padding: '8px 16px' }}>
            <SelectValue placeholder="Date: This Month" />
          </SelectTrigger>
          <SelectContent />
        </Select>
        <Button variant="outline" size="sm">
          <ListFilter />
          Filter
        </Button>
        <Button
          variant="outline"
          size="sm"
          aria-label={__('Sort', 'kirki-ecommerce')}
        >
          <ArrowDownUp />
        </Button>
        <Searchbox placeholder="Search" />
      </ActionGroup>
    </Flex>
  );
};

ActionGroupPreview.displayName = 'ActionGroupPreview';

export default ActionGroupPreview;
