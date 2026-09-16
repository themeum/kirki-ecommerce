import Flex from '@/components/ui/flex';
import Label from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { inventoryTypeOptions } from '@/features/inventory/types';
import { noop } from '@/utils/function';
import { __ } from '@/wpi18n';

type FilterObject = {
  inventory_type?: string;
};

type InventoryTypeFilterProps = {
  filterObject: FilterObject;
  onChange?: (val: string) => void;
};

const InventoryTypeFilter = ({ filterObject, onChange = noop }: InventoryTypeFilterProps) => {
  return (
    <Flex direction="column" gap={2}>
      <Label>{__('Inventory', 'kirki-ecommerce')}</Label>
      <Select
        value={filterObject.inventory_type || undefined}
        onValueChange={(val) => onChange(val)}
      >
        <SelectTrigger>
          <SelectValue placeholder={__('Select', 'kirki-ecommerce')} />
        </SelectTrigger>
        <SelectContent>
          {inventoryTypeOptions.map((option) => (
            <SelectItem key={option.value} value={String(option.value)}>
              {option.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Flex>
  );
};

InventoryTypeFilter.displayName = 'InventoryTypeFilter';

export default InventoryTypeFilter;
