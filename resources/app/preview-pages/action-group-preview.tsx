import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Label from '@/components/ui/label';
import Searchbox from '@/components/ui/searchbox';
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDownUp, ListFilter } from '@/icons';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const ActionGroupPreview = () => {
  return (
    <Flex>
      <Label>This is a random text</Label>
      <ActionGroup>
        <Select disabled>
          <SelectTrigger cssOverride={styles.selectTrigger}>
            <SelectValue placeholder="Date: This Month" />
          </SelectTrigger>
          <SelectContent />
        </Select>
        <Button variant="outline">
          <ListFilter />
          Filter
        </Button>
        <Button
          variant="outline"
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

const styles = defineStyles({
  selectTrigger: {
    padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
  },
});
