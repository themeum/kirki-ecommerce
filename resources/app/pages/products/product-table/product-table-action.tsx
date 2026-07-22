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
        <Select disabled>
          <SelectTrigger style={{ padding: '8px 16px' }}>
            <SelectValue placeholder={__('Date: This Month', 'kirki-ecommerce')} />
          </SelectTrigger>
          <SelectContent />
        </Select>
        <FilterPopup />
        <Button
          variant="outline"
          size="sm"
          aria-label={__('Sort', 'kirki-ecommerce')}
          onClick={handleSortChange}
        >
          <ArrowDownUp />
        </Button>
      </ActionGroup>
    </Flex>
  );
};

ProductTableAction.displayName = 'ProductTableAction';

export default ProductTableAction;
