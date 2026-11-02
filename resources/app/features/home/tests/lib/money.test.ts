import { describe, expect, it } from 'vitest';

import { shortMoney } from '@/features/home/lib/money';

const money = (display: string, short_display: string) => ({
  raw: 0,
  display,
  short_display,
  currency: { code: 'USD', symbol: '$' },
});

describe('shortMoney', () => {
  it('shows the short amount with the long amount as the title', () => {
    expect(shortMoney(money('$20,345.00', '$20.3K'))).toEqual({
      text: '$20.3K',
      title: '$20,345.00',
    });
  });

  it('has no title when the short amount is the same as the long amount', () => {
    expect(shortMoney(money('$850.00', '$850.00'))).toEqual({ text: '$850.00' });
  });
});
