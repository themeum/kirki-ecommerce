import { z } from 'zod';

import { prepareFormSchema } from '@/libs/zod';

const McpSettingsFormShape = z.object({
  enabled: z.boolean().default(false),
  read_only: z.boolean().default(false),
  groups: z.record(z.boolean()).default({}),
  abilities: z.record(z.boolean()).default({}),
});

/**
 * The MCP pages save each switch at once rather than through a page-level
 * form. The schema still shapes every save, so the full group and ability
 * maps always go out: the backend replaces a nested map instead of merging it.
 */
const McpSettingsFormSchema = prepareFormSchema(McpSettingsFormShape).transform((values) => ({
  enabled: values.enabled,
  read_only: values.read_only,
  groups: { ...values.groups },
  abilities: { ...values.abilities },
}));

type McpSettingsFormInput = z.input<typeof McpSettingsFormSchema>;
type McpSettingsFormPayload = z.output<typeof McpSettingsFormSchema>;

export { type McpSettingsFormInput, type McpSettingsFormPayload, McpSettingsFormSchema };
