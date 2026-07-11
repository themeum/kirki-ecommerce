import { ArrowDownUp, ListFilter } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Flex from '@/molecules/flex';
import Searchbox from '@/molecules/searchbox';
import { Select } from '@/molecules/select';
import { setKeyValue } from '@/store/customersSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

const CustomerTableAction = () => {
  const dispatch = useAppDispatch();
  const { search, sort_order } = useAppSelector((state) => state.customers);

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
      <div style={{ width: '180px' }}>
        <Searchbox
          value={search}
          onChange={(value) => handleSearchChange(value as string)}
        />
      </div>
      <ActionGroup>
        <Select
          placeholder="Date: This Month"
          style={{ padding: '8px 16px' }}
        />
        <Button
          type="outlined"
          size="small"
          text="Filter"
          leftIcon={<ListFilter />}
        />
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

export default CustomerTableAction;
