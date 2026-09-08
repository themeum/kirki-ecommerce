import { memo, useState } from 'react';

import DataTableFilterPopover from '@/components/data-table/data-table-filter-popover';
import Flex from '@/components/ui/flex';
import Label from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { OrderListFilter } from '@/features/orders';
import { fulfillmentStatusOptions, orderListOptions, paymentStatusOptions } from '@/features/orders';
import { useListParams } from '@/hooks';
import { __ } from '@/wpi18n';

const emptyFilter: OrderListFilter = {
  fulfillment_status: 'all',
  payment_status: 'all',
};

const FilterPopup = memo(() => {
  const { params, setParams } = useListParams<OrderListFilter>(orderListOptions);
  const [filterObject, setFilterObject] = useState<OrderListFilter>(emptyFilter);

  const appliedCount = [params.fulfillment_status, params.payment_status].filter(Boolean).length;

  const fields = [
    {
      name: 'fulfillment_status' as const,
      label: __('Fulfillment Status', 'kirki-ecommerce'),
      options: fulfillmentStatusOptions,
    },
    {
      name: 'payment_status' as const,
      label: __('Payment Status', 'kirki-ecommerce'),
      options: paymentStatusOptions,
    },
  ];

  const handleOpen = () => {
    setFilterObject({
      fulfillment_status: params.fulfillment_status || 'all',
      payment_status: params.payment_status || 'all',
    });
  };

  const handleOnFilterChange = (val: string, filterName: keyof OrderListFilter) => {
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
      fulfillment_status: resolveValue(filterObject.fulfillment_status),
      payment_status: resolveValue(filterObject.payment_status),
    });
  };

  const handleClear = () => {
    setFilterObject(emptyFilter);
    setParams({
      fulfillment_status: undefined,
      payment_status: undefined,
    });
  };

  return (
    <DataTableFilterPopover
      appliedCount={appliedCount}
      onOpen={handleOpen}
      onClose={() => setFilterObject(emptyFilter)}
      onApply={handleApply}
      onClear={handleClear}
      contentCssOverride={{ minHeight: '208px' }}
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
