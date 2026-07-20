import { z } from 'zod';

export const ProductAttributeValueSchema = z.object({
  id: z.number().optional(),
  value: z.union([z.number(), z.string()]).optional(),
  title: z.string().optional(),
  color: z.string().nullish(),
});

export const ProductAttributeFormSchema = z.object({
  id: z.number().optional(),
  name: z.string().optional(),
  slug: z.string().optional(),
  type: z.string().optional().nullable(),
  values: z.array(ProductAttributeValueSchema).optional(),
});

export type ProductAttributeFormValues = z.infer<
  typeof ProductAttributeFormSchema
>;

export type ProductAttributeValueFormValues = z.infer<
  typeof ProductAttributeValueSchema
>;
