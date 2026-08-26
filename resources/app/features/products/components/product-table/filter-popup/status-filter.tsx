
import Flex from '@/components/ui/flex';
import Label from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ProductStatus } from '@/features/products/schemas/catalog/product';
import { noop } from '@/utils/function';
import { __ } from '@/wpi18n';

type FilterObject = {
  status?: string;
};

type StatusFilterProps = {
  filterObject: FilterObject;
  onChange?: (val: string | number | (string | number)[]) => void;
};

const StatusFilter = ({
  filterObject,
  onChange = noop,
}: StatusFilterProps) => {
  const options: { label: string; value: ProductStatus | 'all' }[] = [
    { label: __('All', 'kirki-ecommerce'), value: 'all' },
    { label: __('Published', 'kirki-ecommerce'), value: 'published' },
    { label: __('Draft', 'kirki-ecommerce'), value: 'draft' },
    { label: __('Trashed', 'kirki-ecommerce'), value: 'trashed' },
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
      <Label>{__('Status', 'kirki-ecommerce')}</Label>
      <Select
        value={filterObject.status || undefined}
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

StatusFilter.displayName = 'StatusFilter';

export default StatusFilter;
