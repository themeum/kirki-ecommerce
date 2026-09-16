import { useMemo } from 'react';

import Flex from '@/components/ui/flex';
import Label from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useShippingMethodsQuery } from '@/features/orders/services/order';
import { noop } from '@/utils/function';
import { __ } from '@/wpi18n';

type FilterObject = {
  shipping_method?: string;
};

type DeliveryMethodFilterProps = {
  filterObject: FilterObject;
  onChange?: (val: string) => void;
};

const DeliveryMethodFilter = ({ filterObject, onChange = noop }: DeliveryMethodFilterProps) => {
  const { data: shippingMethods } = useShippingMethodsQuery();

  const options = useMemo(
    () => [
      { value: 'all', title: __('All', 'kirki-ecommerce') },
      ...(shippingMethods ?? []).map((method) => ({
        value: method.id,
        title: method.name,
      })),
    ],
    [shippingMethods],
  );

  return (
    <Flex direction="column" gap={2}>
      <Label>{__('Delivery Method', 'kirki-ecommerce')}</Label>
      <Select
        value={filterObject.shipping_method || undefined}
        onValueChange={(val) => onChange(val)}
      >
        <SelectTrigger>
          <SelectValue placeholder={__('Select', 'kirki-ecommerce')} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Flex>
  );
};

DeliveryMethodFilter.displayName = 'DeliveryMethodFilter';

export default DeliveryMethodFilter;
