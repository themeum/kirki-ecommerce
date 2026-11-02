import { describe, expect, it } from 'vitest';

import { interpolateShortcodes } from '@/features/settings/email/lib/shortcode';

describe('interpolateShortcodes', () => {
  it('replaces recognized shortcode placeholders with their variable values', () => {
    const result = interpolateShortcodes('Hi {customer_name}, order {order_number} is confirmed.', {
      customer_name: 'Michale Max',
      order_number: '10483',
    });

    expect(result).toBe('Hi Michale Max, order 10483 is confirmed.');
  });

  it('leaves an unrecognized placeholder as literal text', () => {
    const result = interpolateShortcodes('Hello {unknown_tag}!', { customer_name: 'Michale Max' });

    expect(result).toBe('Hello {unknown_tag}!');
  });

  it('leaves a nullish variable as literal text', () => {
    const result = interpolateShortcodes('Hi {customer_name}!', { customer_name: null });

    expect(result).toBe('Hi {customer_name}!');
  });

  it('replaces every occurrence of a repeated placeholder', () => {
    const result = interpolateShortcodes('{order_number} - {order_number}', { order_number: '10483' });

    expect(result).toBe('10483 - 10483');
  });
});
