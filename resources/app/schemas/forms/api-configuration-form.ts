import { z } from 'zod';

export const ApiConfigurationFormSchema = z.object({
  api_key: z.string(),
  update_frequency: z.string().min(1),
  fallback_behaviour: z.string().min(1),
  is_cache_enabled: z.boolean(),
});

export type ApiConfigurationFormValues = z.infer<
  typeof ApiConfigurationFormSchema
>;

export const apiConfigurationDefaultValues: ApiConfigurationFormValues = {
  api_key: '',
  update_frequency: 'every_1_hour',
  fallback_behaviour: 'last_known_rate',
  is_cache_enabled: false,
};
