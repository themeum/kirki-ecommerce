import { z } from 'zod';

export const ABILITY_KINDS = ['tool', 'resource', 'prompt'] as const;

export const McpAbilitySchema = z.object({
  name: z.string(),
  kind: z.enum(ABILITY_KINDS),
  title: z.string(),
  description: z.string().catch(''),
  is_write: z.boolean().catch(false),
});

export const McpAbilityGroupSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().catch(''),
  abilities: z.array(McpAbilitySchema),
});

/**
 * An empty stored map can reach the client as a JSON list on older
 * responses, so anything that is not an object becomes an empty map.
 */
const BooleanMapSchema = z.preprocess(
  (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {}),
  z.record(z.boolean()),
);

/**
 * Fields stay `.nullish()`: every schema in `SettingsSchemaMap` is indexed by
 * a generic key in `getSettings`, and a required output property breaks that
 * union's inference.
 */
export const McpSettingsSchema = z
  .object({
    enabled: z.boolean().nullish(),
    read_only: z.boolean().nullish(),
    groups: BooleanMapSchema.nullish(),
    abilities: BooleanMapSchema.nullish(),
    catalog: z.array(McpAbilityGroupSchema).nullish(),
    server_url: z.string().nullish(),
    user_login: z.string().nullish(),
    profile_url: z.string().nullish(),
    application_passwords_available: z.boolean().nullish(),
    adapter_available: z.boolean().nullish(),
  })
  .passthrough();

export type McpAbility = z.infer<typeof McpAbilitySchema>;
export type McpAbilityGroup = z.infer<typeof McpAbilityGroupSchema>;
export type McpAbilityKind = (typeof ABILITY_KINDS)[number];
export type McpSettings = z.infer<typeof McpSettingsSchema>;
