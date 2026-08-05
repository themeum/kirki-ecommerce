import { z } from 'zod';

import { prepareFormSchema } from '@/libs/zod';
import { __ } from '@/wpi18n';

const TaxRegionPopupFormShape = z.object({
  selectedCountries: z
    .array(z.string())
    .min(1, __('Select at least one country', 'kirki-ecommerce')),
  selectedRegion: z.array(z.record(z.any())),
});

export const TaxRegionPopupFormSchema = prepareFormSchema(TaxRegionPopupFormShape).transform((values) => ({
  selectedCountries: values.selectedCountries,
  selectedRegion: values.selectedRegion,
}));

export type TaxRegionPopupFormInput = z.input<typeof TaxRegionPopupFormSchema>;

export type TaxRegionPopupFormPayload = z.output<typeof TaxRegionPopupFormSchema>;
