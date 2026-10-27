import { z } from 'zod';

import { required } from '@/libs/zod';
import { __ } from '@/wpi18n';

/**
 * Default ribbon colour swatches, shown in the sidebar swatch row alongside
 * a custom colour picker. The first entry is the default. Mirrored in
 * `RibbonColor` on the PHP side (`app/Constants/Product/RibbonColor.php`).
 */
export const RIBBON_COLOR_PALETTE = ['#6d3fe0', '#1f6fe5', '#1e8e4a', '#d9650b', '#1d1d1f'] as const;

export const ProductBasicsFormSchema = z.object({
  title: required(z.string().default(''), __('Title is required', 'kirki-ecommerce')),
  ribbon: z.string().nullish().default(''),
  ribbon_color: z.string().nullish().default(RIBBON_COLOR_PALETTE[0]),
  slug: z.string().nullish().default(''),
  short_description: z.string().nullish().default(''),
  description: z.string().nullish().default(''),
});
