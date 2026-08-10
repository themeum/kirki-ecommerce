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

const MoneyObjectSchema = z.object({
  raw: MoneyAmountSchema,
  display: z.string(),
  currency: z.object({
    code: z.string(),
    symbol: z.string(),
  }),
})

/**
 * Shape every `ApiClientResponse<T>` envelope must satisfy before its `data`
 * is handed to a resource schema — catches a malformed or non-object
 * response with a reported `ApiValidationError` instead of a raw
 * `Cannot read properties of undefined` crash.
 */
const ApiEnvelopeSchema = z.object({ data: z.unknown() }).passthrough();

/**
 * Envelope for delete/bulk-action endpoints that return only a status
 * message, no resource `data`. Lenient on purpose (design.md - Decision 6)
 * — every consumer already falls back with `response.message || '...'`.
 */
const MessageResponseSchema = z
  .object({
    success: z.boolean().optional(),
    message: z.string().optional(),
  })
  .passthrough();

type MessageResponse = z.infer<typeof MessageResponseSchema>;

type MoneyObject = z.infer<typeof MoneyObjectSchema>;

export { ApiEnvelopeSchema, MessageResponseSchema, MoneyAmountSchema, MoneyObjectSchema, PaginatedDataSchema, ResourceCollectionSchema, type MessageResponse, type MoneyObject };

