
import Flex from '@/components/ui/flex';
import Label from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { noop } from '@/utils/function';
import { __ } from '@/wpi18n';

type FilterObject = {
  inventory_type?: string;
};

type InventoryTypeFilterProps = {
  filterObject: FilterObject;
  onChange?: (val: string | number | (string | number)[]) => void;
};

const InventoryTypeFilter = ({
  filterObject,
  onChange = noop,
}: InventoryTypeFilterProps) => {
  const options: { label: string; value: string }[] = [
    { label: __('All', 'kirki-ecommerce'), value: 'all' },
    { label: __('In stock', 'kirki-ecommerce'), value: 'in_stock' },
    { label: __('Out of stock', 'kirki-ecommerce'), value: 'out_of_stock' },
  ];

  const handleChange = (value: string | string[]) => {
    const nextValue = Array.isArray(value) ? value[0] : value;
    if (!nextValue || nextValue === 'all') {
      onChange(nextValue);
      return;
    }
    onChange(nextValue);
  };

  return (
    <Flex direction="column" gap={2}>
      <Label>{__('Inventory', 'kirki-ecommerce')}</Label>
      <Select
        value={filterObject.inventory_type || undefined}
        onValueChange={(val) => handleChange(val)}
      >
        <SelectTrigger>
          <SelectValue placeholder={__('Select', 'kirki-ecommerce')} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option, index) => (
            <SelectItem key={index} value={String(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Flex>
  );
};

InventoryTypeFilter.displayName = 'InventoryTypeFilter';

export default InventoryTypeFilter;
