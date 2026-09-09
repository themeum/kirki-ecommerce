import { type ComponentProps, memo, useState } from 'react';

import DataTableFilterPopover from '@/components/data-table/data-table-filter-popover';
import type Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Label from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CouponListFilter } from '@/features/coupons';
import {
  couponListOptions,
  discountTypeOptions,
  methodOptions,
  statusOptions,
} from '@/features/coupons';
import { useListParams } from '@/hooks';
import { noop } from '@/utils/function';
import { __ } from '@/wpi18n';

type FilterPopupProps = {
  onChange?: () => void;
  buttonProps?: ComponentProps<typeof Button>;
  data?: unknown;
};

const EMPTY_FILTERS: CouponListFilter = {
  status: 'all',
  discount_type: 'all',
  method: 'all',
};

const FilterPopup = memo(({ onChange: _onChange = noop, data: _data }: FilterPopupProps) => {
  const { params, setParams } = useListParams<CouponListFilter>(couponListOptions);
  const [filterObject, setFilterObject] = useState<CouponListFilter>(EMPTY_FILTERS);

  const appliedCount = [params.status, params.discount_type, params.method].filter(Boolean).length;

  const fields = [
    { name: 'status' as const, label: __('Status', 'kirki-ecommerce'), options: statusOptions },
    { name: 'method' as const, label: __('Method', 'kirki-ecommerce'), options: methodOptions },
    {
      name: 'discount_type' as const,
      label: __('Type', 'kirki-ecommerce'),
      options: discountTypeOptions,
    },
  ];

  const handleOpen = () => {
    setFilterObject({
      status: params.status || 'all',
      discount_type: params.discount_type || 'all',
      method: params.method || 'all',
    });
  };

  const handleOnFilterChange = (val: string, filterName: keyof CouponListFilter) => {
    setFilterObject((prev) => ({
      ...prev,
      [filterName]: val,
    }));
  };

  const resolveValue = (value: string | undefined) => {
    if (!value || value === 'all') {
      return undefined;
    }

    return value;
  };

  const handleApply = () => {
    setParams({
      status: resolveValue(filterObject.status),
      discount_type: resolveValue(filterObject.discount_type),
      method: resolveValue(filterObject.method),
    });
  };

  const handleClear = () => {
    setFilterObject(EMPTY_FILTERS);
    setParams({
      status: undefined,
      discount_type: undefined,
      method: undefined,
    });
  };

  return (
    <DataTableFilterPopover
      appliedCount={appliedCount}
      onOpen={handleOpen}
      onClose={() => setFilterObject(EMPTY_FILTERS)}
      onApply={handleApply}
      onClear={handleClear}
      contentCssOverride={{ minHeight: '264px' }}
    >
      {fields.map((field) => (
        <Flex key={field.name} direction="column" gap={2}>
          <Label>{field.label}</Label>
          <Select
            value={filterObject[field.name] || undefined}
            onValueChange={(val) => handleOnFilterChange(val, field.name)}
          >
            <SelectTrigger>
              <SelectValue placeholder={__('Select', 'kirki-ecommerce')} />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Flex>
      ))}
    </DataTableFilterPopover>
  );
});

FilterPopup.displayName = 'FilterPopup';

export default FilterPopup;
