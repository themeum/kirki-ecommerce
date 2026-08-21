import { z } from 'zod';

export const MediaSizeSchema = z.object({
  height: z.number(),
  width: z.number(),
  url: z.string(),
  orientation: z.enum(['portrait', 'landscape']).optional(),
});

export type MediaSize = z.infer<typeof MediaSizeSchema>;

const MediaRefSchemaBase = z.object({
  id: z.union([z.string(), z.number()]),
  url: z.string(),
  filename: z.string().optional(),
  sizes: z.record(z.string(), MediaSizeSchema).nullish(),
  height: z.number().optional(),
  width: z.number().optional(),
  filesize: z.number().optional(),
  mime: z.string().nullish(),
  type: z.string().optional(),
  thumb: z.string().nullish(),
  author: z.string().optional(),
  author_name: z.string().optional(),
  date: z.union([z.string(), z.number(), z.date()]).optional(),
  alt: z.string().optional(),
});

export const MediaRefSchema = MediaRefSchemaBase.extend({
  poster: MediaRefSchemaBase.nullish(),
});

export type MediaRef = z.infer<typeof MediaRefSchema>;
