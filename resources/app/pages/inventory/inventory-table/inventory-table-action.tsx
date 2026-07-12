import type { Dispatch, SetStateAction } from 'react';

import DropdownButton from '@/components/dropdown-button';
import { useListParams } from '@/hooks';
import { LayoutIcon, ListFilter } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Flex from '@/molecules/flex';
import Searchbox from '@/molecules/searchbox';
import { Select } from '@/molecules/select';
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
  const { params, setParam } = useListParams({
    defaults: { sort_by: 'id', sort_order: 'asc', page: 1, limit: 20 },
  });

  return (
    <Flex style={{ padding: '16px 12px' }}>
      <div style={{ width: '180px' }}>
        <Searchbox
          onChange={(value) => setParam('search', value as string)}
          value={params.search}
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

InventoryTableAction.displayName = 'InventoryTableAction';

export default InventoryTableAction;
