import { z } from 'zod';

export const StateSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  code: z.string().optional(),
  flag: z.string().optional(),
});

export type State = z.infer<typeof StateSchema>;

export const AddressFieldModeSchema = z.enum(['hidden', 'optional', 'required']);

export const AddressRulesSchema = z.object({
  state: z.object({
    mode: AddressFieldModeSchema,
    label: z.string(),
  }),
  postal_code: z.object({
    mode: AddressFieldModeSchema,
  }),
});

export type AddressFieldMode = z.infer<typeof AddressFieldModeSchema>;
export type AddressRules = z.infer<typeof AddressRulesSchema>;

export const CountrySchema = z.object({
  name: z.string(),
  code: z.string(),
  group: z.string().nullish(),
  phone_code: z.string().nullish(),
  currency: z.string().nullish(),
  currency_name: z.string().nullish(),
  currency_symbol: z.string().nullish(),
  flag: z
    .string()
    .nullish()
    .transform((value) => value ?? undefined),
  states: z.array(StateSchema).nullish(),
  address_rules: AddressRulesSchema.nullish(),
});

export type Country = z.infer<typeof CountrySchema>;
