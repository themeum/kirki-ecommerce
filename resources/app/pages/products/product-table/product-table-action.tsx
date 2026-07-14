import { ArrowDownUp } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Flex from '@/molecules/flex';
import Searchbox from '@/molecules/searchbox';
import { Select } from '@/molecules/select';
import { useListParams } from '@/hooks';
import { __ } from '@/wpi18n';

import FilterPopup from '@/pages/products/product-table/filter-popup/filter-popup';

const ProductTableAction = () => {
  const { params, setParam } = useListParams({
    defaults: {
      search: '',
      sort_by: 'title',
      sort_order: 'asc',
      page: 1,
      limit: 10,
    },
  });

  const handleSearchChange = (value: string) => {
    setParam('search', value);
  };

  const handleSortChange = () => {
    setParam('sort_order', params.sort_order === 'asc' ? 'desc' : 'asc');
  };

  return (
    <Flex style={{ padding: '16px 12px' }}>
      <div style={{ width: '160px' }}>
        <Searchbox
          onChange={(value) => handleSearchChange(value as string)}
          value={params.search || ''}
        />
      </div>
      <ActionGroup>
        <Select
          placeholder={__('Date: This Month', 'kirki-ecommerce')}
          style={{ padding: '8px 16px' }}
          size="small"
        />
        <FilterPopup />
        <Button
          type="outlined"
          size="small"
          icon={<ArrowDownUp />}
          onClick={handleSortChange}
        />
      </ActionGroup>
    </Flex>
  );
};

ProductTableAction.displayName = 'ProductTableAction';

export default ProductTableAction;
