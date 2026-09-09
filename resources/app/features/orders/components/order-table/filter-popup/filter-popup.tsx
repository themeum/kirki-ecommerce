import { memo } from 'react';

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
import { orderListOptions, orderStatusOptions, paymentStatusOptions } from '@/features/orders';
import DeliveryMethodFilter from '@/features/orders/components/order-table/filter-popup/delivery-method-filter';
import { useFilterDraft } from '@/hooks';
import { __ } from '@/wpi18n';

type OrderFilterDraft = {
  status: string;
  payment_status: string;
  shipping_method: string;
};

const EMPTY_FILTERS: OrderFilterDraft = {
  status: 'all',
  payment_status: 'all',
  shipping_method: 'all',
};

const fields = [
  { name: 'status' as const, label: __('Status', 'kirki-ecommerce'), options: orderStatusOptions },
  {
    name: 'payment_status' as const,
    label: __('Payment Status', 'kirki-ecommerce'),
    options: paymentStatusOptions,
  },
];

const FilterPopup = memo(() => {
  const { draft, appliedCount, setDraftValue, handleOpen, handleClose, handleApply, handleClear } =
    useFilterDraft<OrderListFilter, OrderFilterDraft>(orderListOptions, EMPTY_FILTERS);

  return (
    <DataTableFilterPopover
      appliedCount={appliedCount}
      onOpen={handleOpen}
      onClose={handleClose}
      onApply={handleApply}
      onClear={handleClear}
      contentCssOverride={{ minHeight: '264px' }}
    >
      {fields.map((field) => (
        <Flex key={field.name} direction="column" gap={2}>
          <Label>{field.label}</Label>
          <Select
            value={draft[field.name] || undefined}
            onValueChange={(val) => setDraftValue(field.name, val)}
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

      <DeliveryMethodFilter
        filterObject={draft}
        onChange={(val) => setDraftValue('shipping_method', val)}
      />
    </DataTableFilterPopover>
  );
});

FilterPopup.displayName = 'FilterPopup';

export default FilterPopup;
