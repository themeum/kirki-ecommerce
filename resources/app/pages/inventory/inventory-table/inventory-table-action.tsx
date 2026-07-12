import type { Dispatch, SetStateAction } from 'react';

import DropdownButton from '@/components/dropdown-button';
import { LayoutIcon, ListFilter } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Flex from '@/molecules/flex';
import Searchbox from '@/molecules/searchbox';
import { Select } from '@/molecules/select';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setKeyValue } from '@/store/inventorySlice';
import { __ } from '@/wpi18n';

import { allTableHeaders } from '@/pages/inventory/utils';

type InventoryTableActionProps = {
  selectedFields: string[];
  setSelectedFields: Dispatch<SetStateAction<string[]>>;
};

const InventoryTableAction = ({
  selectedFields,
  setSelectedFields,
}: InventoryTableActionProps) => {
  const dispatch = useAppDispatch();
  const { search } = useAppSelector((state) => state.inventory);

  const handleSearchChange = (value: string) => {
    dispatch(setKeyValue({ key: 'search', value: value }));
  };

  return (
    <Flex style={{ padding: '16px 12px' }}>
      <div style={{ width: '180px' }}>
        <Searchbox
          onChange={(value) => handleSearchChange(value as string)}
          value={search}
          placeholder={__('Search Products', 'kirki-ecommerce')}
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
          text={__('Filter', 'kirki-ecommerce')}
          leftIcon={<ListFilter />}
        />
        <DropdownButton
          buttonProps={{
            type: 'outlined',
            size: 'small',
            icon: <LayoutIcon />,
          }}
          options={allTableHeaders}
          value={selectedFields}
          hasLeftIcon
          checkboxField
          multiple
          dropdownStyle={{ minWidth: '288px' }}
          onOptionSelect={(value) =>
            setSelectedFields(value as string[])
          }
        />
      </ActionGroup>
    </Flex>
  );
};

export default InventoryTableAction;
