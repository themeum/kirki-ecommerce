import { z } from 'zod';

import { prepareFormSchema, required } from '@/libs/zod';
import { __ } from '@/wpi18n';

const ApiConfigurationFormShape = z.object({
  api_key: z.string(),
  update_frequency: required(z.string(), __('This field is required', 'kirki-ecommerce')),
  fallback_behaviour: required(z.string(), __('This field is required', 'kirki-ecommerce')),
  is_cache_enabled: z.boolean(),
});

export const ApiConfigurationFormSchema = prepareFormSchema(ApiConfigurationFormShape).transform((values) => ({
  api_key: values.api_key,
  update_frequency: values.update_frequency,
  fallback_behaviour: values.fallback_behaviour,
  is_cache_enabled: values.is_cache_enabled,
}));

export type ApiConfigurationFormInput = z.input<typeof ApiConfigurationFormSchema>;

export type ApiConfigurationFormPayload = z.output<typeof ApiConfigurationFormSchema>;
