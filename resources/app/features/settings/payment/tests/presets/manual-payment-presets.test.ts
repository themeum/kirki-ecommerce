import { Banknote, Landmark, ReceiptText } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import {
  getManualPaymentPresets,
  getManualPresetIcon,
} from '@/features/settings/payment/presets/manual-payment-presets';

describe('getManualPaymentPresets', () => {
  it('lists bank transfer, cheque and cash on delivery in that order', () => {
    const presets = getManualPaymentPresets();

    expect(presets.map((preset) => [preset.id, preset.name])).toEqual([
      ['bank_transfer', 'Direct bank transfer'],
      ['cheque', 'Cheque payments'],
      ['cod', 'Cash on delivery'],
    ]);
  });

  it('uses the same instructions as the onboarding seeder', () => {
    const instructionsById = Object.fromEntries(
      getManualPaymentPresets().map((preset) => [preset.id, preset.instructions]),
    );

    expect(instructionsById.bank_transfer).toBe(
      'Pay directly into our bank account, using your order number as the reference.',
    );
    expect(instructionsById.cod).toBe('Pay with cash when your order is delivered.');
    expect(instructionsById.cheque).toBe(
      'Send a cheque payable to our store, with your order number on the back.',
    );
  });
});

describe('getManualPresetIcon', () => {
  it('returns the icon of each preset id', () => {
    expect(getManualPresetIcon('bank_transfer')).toBe(Landmark);
    expect(getManualPresetIcon('cheque')).toBe(ReceiptText);
    expect(getManualPresetIcon('cod')).toBe(Banknote);
  });

  it('returns null for an unknown, numeric or missing id', () => {
    expect(getManualPresetIcon('3f2a-uuid')).toBeNull();
    expect(getManualPresetIcon(7)).toBeNull();
    expect(getManualPresetIcon(undefined)).toBeNull();
  });
});
