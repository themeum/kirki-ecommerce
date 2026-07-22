import type { Dispatch, SetStateAction } from 'react';

import DropdownButton from '@/components/dropdown-button';
import Button from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useListParams } from '@/hooks';
import { LayoutIcon, ListFilter } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Flex from '@/molecules/flex';
import Searchbox from '@/components/ui/searchbox';
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
        <Select disabled>
          <SelectTrigger style={{ padding: '8px 16px' }}>
            <SelectValue placeholder={__('Date: This Month', 'kirki-ecommerce')} />
          </SelectTrigger>
          <SelectContent />
        </Select>
        <Button variant="outline" size="sm">
          <ListFilter />
          {__('Filter', 'kirki-ecommerce')}
        </Button>
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
