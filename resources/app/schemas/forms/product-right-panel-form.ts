import { z } from 'zod';

import { ProductBrandSchema, ProductCategoryRefSchema, ProductCollectionRefSchema, ProductStatusSchema, ProductTagRefSchema } from '@/schemas/catalog/product';

export const ProductRightPanelFormSchema = z.object({
  status: z.union([ProductStatusSchema, z.string()]),
  brand: ProductBrandSchema.nullable(),
  categories: z.array(ProductCategoryRefSchema).nullable(),
  tags: z.array(ProductTagRefSchema),
  collections: z.array(ProductCollectionRefSchema),
});

export type ProductRightPanelFormValues = z.infer<
  typeof ProductRightPanelFormSchema
>;

export const productRightPanelDefaultValues: ProductRightPanelFormValues = {
  status: 'draft',
  brand: null,
  categories: [],
  tags: [],
  collections: [],
};
