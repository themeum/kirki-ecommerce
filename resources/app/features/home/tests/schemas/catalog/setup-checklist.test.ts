import { describe, expect, it } from 'vitest';

import { SetupChecklistSchema } from '@/features/home/schemas/catalog/setup-checklist';

const step = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  is_completed: false,
  is_preconfigured: false,
  has_data: false,
  ...overrides,
});

describe('SetupChecklistSchema', () => {
  it('accepts the payload served by GET /setup-checklist', () => {
    const payload = {
      steps: [
        step('products', { is_completed: true, has_data: true }),
        step('payments'),
        step('tax', { is_preconfigured: true, has_data: true }),
        step('shipping'),
      ],
    };

    expect(SetupChecklistSchema.parse(payload)).toEqual(payload);
  });

  it('accepts a checklist without the hidden tax step', () => {
    const payload = {
      steps: [step('products'), step('payments'), step('shipping')],
    };

    expect(SetupChecklistSchema.parse(payload).steps.map(({ id }) => id)).toEqual([
      'products',
      'payments',
      'shipping',
    ]);
  });

  it('rejects an unknown step id', () => {
    expect(SetupChecklistSchema.safeParse({ steps: [step('launch')] }).success).toBe(false);
  });

  it('rejects a step missing its completion flag', () => {
    const { is_completed: _omitted, ...incomplete } = step('products');

    expect(SetupChecklistSchema.safeParse({ steps: [incomplete] }).success).toBe(false);
  });
});
