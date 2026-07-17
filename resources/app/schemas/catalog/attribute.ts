import { z } from 'zod';

export const AttributeValueSchema = z.object({
  id: z.number(),
  value: z.string(),
  color: z.string().nullish(),
});

export type AttributeValue = z.infer<typeof AttributeValueSchema>;

export const AttributeTypeSchema = z.enum(['color', 'list']);

export type AttributeType = z.infer<typeof AttributeTypeSchema>;

export const AttributeSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string().optional(),
  type: z.union([AttributeTypeSchema, z.string()]).optional(),
  values: z.array(AttributeValueSchema).optional(),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
});

export type Attribute = z.infer<typeof AttributeSchema>;

export const ProductAttributeSchema = z.object({
  id: z.number(),
  name: z.string(),
  values: z.array(AttributeValueSchema).optional(),
});

export type ProductAttribute = z.infer<typeof ProductAttributeSchema>;
