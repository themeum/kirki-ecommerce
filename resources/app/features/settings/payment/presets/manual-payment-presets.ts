import { Banknote, Landmark, type LucideIcon, ReceiptText } from 'lucide-react';

import { __ } from '@/wpi18n';

type ManualPaymentPreset = {
  id: string;
  name: string;
  instructions: string;
  icon: LucideIcon;
};

const getManualPaymentPresets = (): ManualPaymentPreset[] => [
  {
    id: 'bank_transfer',
    name: __('Direct bank transfer', 'kirki-ecommerce'),
    instructions: __(
      'Pay directly into our bank account, using your order number as the reference.',
      'kirki-ecommerce',
    ),
    icon: Landmark,
  },
  {
    id: 'cheque',
    name: __('Cheque payments', 'kirki-ecommerce'),
    instructions: __(
      'Send a cheque payable to our store, with your order number on the back.',
      'kirki-ecommerce',
    ),
    icon: ReceiptText,
  },
  {
    id: 'cod',
    name: __('Cash on delivery', 'kirki-ecommerce'),
    instructions: __('Pay with cash when your order is delivered.', 'kirki-ecommerce'),
    icon: Banknote,
  },
];

const getManualPresetIcon = (id: string | number | undefined): LucideIcon | null => {
  return getManualPaymentPresets().find((preset) => preset.id === id)?.icon ?? null;
};

export { getManualPaymentPresets, getManualPresetIcon, type ManualPaymentPreset };
