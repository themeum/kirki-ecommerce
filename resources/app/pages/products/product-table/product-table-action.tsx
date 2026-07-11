import { ArrowDownUp } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Flex from '@/molecules/flex';
import Searchbox from '@/molecules/searchbox';
import { Select } from '@/molecules/select';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setKeyValue } from '@/store/productsSlice';
import { __ } from '@/wpi18n';

import FilterPopup from './filter-popup/filter-popup';

const ProductTableAction = () => {
  const dispatch = useAppDispatch();
  const { search, sort_order } = useAppSelector((state) => state.products);

  const handleSearchChange = (value: string) => {
    dispatch(setKeyValue({ key: 'search', value: value }));
  };

  const handleSortChange = () => {
    if (sort_order === 'asc') {
      dispatch(setKeyValue({ key: 'sort_order', value: 'desc' }));
    } else {
      dispatch(setKeyValue({ key: 'sort_order', value: 'asc' }));
    }
  };
  return (
    <Flex style={{ padding: '16px 12px' }}>
      <div style={{ width: '160px' }}>
        <Searchbox
          onChange={(value) => handleSearchChange(value as string)}
          value={search}
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

export default ProductTableAction;
