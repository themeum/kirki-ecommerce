import { z } from 'zod';

export const TaxRegionPopupFormSchema = z.object({
  selectedCountries: z.array(z.string()).min(1),
  selectedRegion: z.array(z.record(z.any())),
});

export type TaxRegionPopupFormValues = z.infer<typeof TaxRegionPopupFormSchema>;
