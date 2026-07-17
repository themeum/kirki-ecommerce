import { z } from 'zod';

export const StateSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  code: z.string().optional(),
  flag: z.string().optional(),
});

export type State = z.infer<typeof StateSchema>;

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
});

export type Country = z.infer<typeof CountrySchema>;
