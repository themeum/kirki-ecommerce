import { ArrowDownUp } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Flex from '@/molecules/flex';
import Searchbox from '@/molecules/searchbox';
import { Select } from '@/molecules/select';
import { useListParams } from '@/hooks';
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
    <Flex style={{ padding: '16px 12px' }}>
      <div style={{ width: '180px' }}>
        <Searchbox
          value={params.search || ''}
          onChange={(value) => handleSearchChange(value)}
        />
      </div>
      <ActionGroup>
        <Select
          placeholder={__('Date: This Month', 'kirki-ecommerce')}
          style={{ padding: '8px 16px' }}
        />
        <Button
          type="outlined"
          size="small"
          icon={<ArrowDownUp />}
          onClick={onSortChange}
        />
      </ActionGroup>
    </Flex>
  );
};

CollectionTableAction.displayName = 'CollectionTableAction';

export default CollectionTableAction;
