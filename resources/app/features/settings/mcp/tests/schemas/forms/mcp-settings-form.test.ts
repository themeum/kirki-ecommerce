import { describe, expect, it } from 'vitest';

import { McpSettingsFormSchema } from '@/features/settings/mcp/schemas/forms/mcp-settings-form';

describe('McpSettingsFormSchema', () => {
  it('produces the exact payload for a full set of values', () => {
    const result = McpSettingsFormSchema.parse({
      enabled: true,
      read_only: true,
      groups: { orders: false },
      abilities: { 'kirki-ecommerce/cancel-order': false },
    });

    expect(result).toEqual({
      enabled: true,
      read_only: true,
      groups: { orders: false },
      abilities: { 'kirki-ecommerce/cancel-order': false },
    });
  });

  it('sends empty maps and off switches when nothing is set', () => {
    expect(McpSettingsFormSchema.parse({})).toEqual({
      enabled: false,
      read_only: false,
      groups: {},
      abilities: {},
    });
  });

  it('rejects a value that is not a boolean', () => {
    expect(() =>
      McpSettingsFormSchema.parse({ abilities: { 'kirki-ecommerce/cancel-order': 'no' } }),
    ).toThrow();
  });
});
