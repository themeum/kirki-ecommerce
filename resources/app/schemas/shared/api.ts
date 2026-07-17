import { z } from 'zod';

const PaginatedDataSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    results: z.array(itemSchema),
    total: z.number(),
    count: z.number().optional(),
    per_page: z.number(),
    current_page: z.number().optional(),
    last_page: z.number().optional(),
    from: z.number().nullish(),
    to: z.number().nullish(),
    has_more_pages: z.boolean().optional(),
  });

const ResourceCollectionSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.array(itemSchema);

const MoneyAmountSchema = z.union([z.number(), z.string()]);

export { PaginatedDataSchema, ResourceCollectionSchema, MoneyAmountSchema };
