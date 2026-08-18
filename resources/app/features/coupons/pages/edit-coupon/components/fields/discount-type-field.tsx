import { CircleDollarSign, Package, Truck } from 'lucide-react';

import RadioCardField from '@/components/form/radio-card-field';
import { __ } from '@/wpi18n';

const options = [
  {
    value: 'amount-off',
    label: __('Amount Off', 'kirki-ecommerce'),
    icon: <CircleDollarSign size={20} />,
    hidden: false,
  },
  {
    value: 'free-shipping',
    label: __('Free Shipping', 'kirki-ecommerce'),
    icon: <Truck size={20} />,
    hidden: false,
  },
  {
    value: 'buy-x-get-y',
    label: __('Buy X get Y', 'kirki-ecommerce'),
    icon: <Package size={20} />,
    hidden: true,
  },
] as const;

const DiscountTypeField = () => {
  return (
    <RadioCardField
      name="discount_type"
      options={options
        .filter((option) => !option.hidden)
        .map((option) => ({
          value: option.value,
          label: option.label,
          icon: option.icon,
        }))}
      disabled
    />
  );
};

DiscountTypeField.displayName = 'DiscountTypeField';

export default DiscountTypeField;
