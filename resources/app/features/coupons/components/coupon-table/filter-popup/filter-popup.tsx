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
import type { CouponListFilter } from '@/features/coupons';
import {
  couponListOptions,
  discountTypeOptions,
  methodOptions,
  statusOptions,
} from '@/features/coupons';
import { useFilterDraft } from '@/hooks';
import { __ } from '@/wpi18n';

type CouponFilterDraft = {
  status: string;
  method: string;
  discount_type: string;
};

const EMPTY_FILTERS: CouponFilterDraft = {
  status: 'all',
  method: 'all',
  discount_type: 'all',
};

const fields = [
  { name: 'status' as const, label: __('Status', 'kirki-ecommerce'), options: statusOptions },
  { name: 'method' as const, label: __('Method', 'kirki-ecommerce'), options: methodOptions },
  {
    name: 'discount_type' as const,
    label: __('Type', 'kirki-ecommerce'),
    options: discountTypeOptions,
  },
];

const FilterPopup = memo(() => {
  const { draft, appliedCount, setDraftValue, handleOpen, handleClose, handleApply, handleClear } =
    useFilterDraft<CouponListFilter, CouponFilterDraft>(couponListOptions, EMPTY_FILTERS);

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
    </DataTableFilterPopover>
  );
});

FilterPopup.displayName = 'FilterPopup';

export default FilterPopup;
