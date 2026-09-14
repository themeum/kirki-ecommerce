import { z } from 'zod';

import { prepareFormSchema, required } from '@/libs/zod';
import { __ } from '@/wpi18n';

const ApiConfigurationFormShape = z.object({
  api_key: required(z.string().nullish().default(''), __('API Key is required', 'kirki-ecommerce')),
  update_frequency: required(
    z.string().nullish().default('every_1_hour'),
    __('Update Frequency is required', 'kirki-ecommerce'),
  ),
  fallback_behaviour: required(
    z.string().nullish().default('last_known_rate'),
    __('Fallback Behaviour is required', 'kirki-ecommerce'),
  ),
  is_cache_enabled: z.boolean().nullish().default(false),
});

export const ApiConfigurationFormSchema = prepareFormSchema(ApiConfigurationFormShape).transform(
  (values) => ({
    api_key: values.api_key,
    update_frequency: values.update_frequency,
    fallback_behaviour: values.fallback_behaviour,
    is_cache_enabled: values.is_cache_enabled,
  }),
);

export type ApiConfigurationFormInput = z.input<typeof ApiConfigurationFormSchema>;

export type ApiConfigurationFormPayload = z.output<typeof ApiConfigurationFormSchema>;
