import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Button from '@/components/ui/button';
import { ArrowDownUp } from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import Flex from '@/components/ui/flex';
import Searchbox from '@/components/ui/searchbox';
import { useListParams } from '@/hooks';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type CollectionTableActionProps = {
  onSortChange?: () => void;
};

const CollectionTableAction = ({ onSortChange }: CollectionTableActionProps) => {
  const { params, setParam } = useListParams({
    defaults: {
      search: '',
      sort_by: 'title',
      sort_order: 'asc',
      page: 1,
      limit: 10,
    },
  });

  const handleSearchChange = (value: string | number) => {
    setParam('search', value);
  };

  return (
    <Flex css={styles.wrapper}>
      <div style={{ width: '180px' }}>
        <Searchbox
          value={params.search || ''}
          onChange={(value) => handleSearchChange(value)}
        />
      </div>
      <ActionGroup>
        <Select disabled>
          <SelectTrigger css={styles.selectTrigger}>
            <SelectValue placeholder={__('Date: This Month', 'kirki-ecommerce')} />
          </SelectTrigger>
          <SelectContent />
        </Select>
        <Button
          variant="outline"
          aria-label={__('Sort', 'kirki-ecommerce')}
          onClick={onSortChange}
        >
          <ArrowDownUp />
        </Button>
      </ActionGroup>
    </Flex>
  );
};

CollectionTableAction.displayName = 'CollectionTableAction';

export default CollectionTableAction;

const styles = {
  wrapper: scoped({
    padding: `${theme.spacing[4]} ${theme.spacing[3]}`,
  }),
  selectTrigger: scoped({
    padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
  }),
};
