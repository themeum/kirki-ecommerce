import { z } from 'zod';

import { prepareFormSchema, required } from '@/libs/zod';
import { __ } from '@/wpi18n';

const OnboardingAddressFormShape = z.object({
  address_line_1: z.string().nullish().default(''),
  address_line_2: z.string().nullish().default(''),
  city: z.string().nullish().default(''),
  state: z.string().nullish().default(''),
  postal_code: z.string().nullish().default(''),
});

const OnboardingFormShape = z.object({
  store_name: required(z.string().default(''), __('Store name is required', 'kirki-ecommerce')),
  industry: z.string().nullish().default(''),
  country: required(z.string().default(''), __('Country is required', 'kirki-ecommerce')),
  store_address: OnboardingAddressFormShape.nullish(),
  currency: required(z.string().default(''), __('Currency is required', 'kirki-ecommerce')),
  is_tax_collected: z.boolean().default(false),
  is_tax_inclusive_price: z.boolean().default(false),
  store_tax_id: z.string().nullish().default(''),
});

const toNullableText = (value: string | null | undefined) => value?.trim() || null;

const OnboardingFormSchema = prepareFormSchema(OnboardingFormShape).transform((values) => ({
  store_name: values.store_name.trim(),
  industry: values.industry || 'other',
  country: values.country,
  store_address: {
    address_line_1: toNullableText(values.store_address?.address_line_1),
    address_line_2: toNullableText(values.store_address?.address_line_2),
    city: toNullableText(values.store_address?.city),
    state: toNullableText(values.store_address?.state),
    postal_code: toNullableText(values.store_address?.postal_code),
  },
  currency: values.currency,
  is_tax_collected: values.is_tax_collected,
  is_tax_inclusive_price: values.is_tax_collected && values.is_tax_inclusive_price,
  store_tax_id: values.is_tax_collected ? toNullableText(values.store_tax_id) : null,
}));

type OnboardingFormInput = z.input<typeof OnboardingFormSchema>;

type OnboardingFormPayload = z.output<typeof OnboardingFormSchema>;

export { type OnboardingFormInput, type OnboardingFormPayload, OnboardingFormSchema };
