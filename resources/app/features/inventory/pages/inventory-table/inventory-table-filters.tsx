import type { Dispatch, SetStateAction } from 'react';

import DropdownButton from '@/components/dropdown-button';
import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Searchbox from '@/components/ui/searchbox';
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import { allTableHeaders } from '@/features/inventory/lib/utils';
import { inventoryListOptions } from '@/features/inventory/types';
import { useListParams } from '@/hooks';
import { LayoutIcon, ListFilter } from '@/icons';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type InventoryTableFiltersProps = {
  selectedFields: string[];
  setSelectedFields: Dispatch<SetStateAction<string[]>>;
};

const InventoryTableFilters = ({
  selectedFields,
  setSelectedFields,
}: InventoryTableFiltersProps) => {
  const { params, setParam } = useListParams(inventoryListOptions);

  return (
    <Flex cssOverride={styles.wrapper}>
      <div style={{ width: '180px' }}>
        <Searchbox
          onChange={(value) => setParam('search', value)}
          value={params.search}
          placeholder={__('Search Products', 'kirki-ecommerce')}
        />
      </div>

      <ActionGroup>
        <Select disabled>
          <SelectTrigger cssOverride={styles.selectTrigger}>
            <SelectValue placeholder={__('Date: This Month', 'kirki-ecommerce')} />
          </SelectTrigger>
          <SelectContent />
        </Select>
        <Button variant="outline">
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

InventoryTableFilters.displayName = 'InventoryTableFilters';

export default InventoryTableFilters;

const styles = defineStyles({
  wrapper: {
    padding: `${theme.spacing[4]} ${theme.spacing[3]}`,
  },
  selectTrigger: {
    padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
  },
});
