import { z } from 'zod';

export const MediaSizeSchema = z.object({
  height: z.number(),
  width: z.number(),
  url: z.string(),
  orientation: z.enum(['portrait', 'landscape']).optional(),
});

export type MediaSize = z.infer<typeof MediaSizeSchema>;

export type MediaRef = {
  id: string | number;
  url: string;
  filename?: string;
  sizes?: Record<string, MediaSize>;
  height?: number;
  width?: number;
  filesize?: number;
  mime?: string | null;
  type?: string;
  thumb?: string | null;
  author?: string;
  author_name?: string;
  date?: string;
  alt?: string;
  poster?: MediaRef | null;
};

export const MediaRefSchema: z.ZodType<MediaRef> = z.lazy(() =>
  z.object({
    id: z.union([z.string(), z.number()]),
    url: z.string(),
    filename: z.string().optional(),
    sizes: z.record(MediaSizeSchema).optional(),
    height: z.number().optional(),
    width: z.number().optional(),
    filesize: z.number().optional(),
    mime: z.string().nullish(),
    type: z.string().optional(),
    thumb: z.string().nullish(),
    author: z.string().optional(),
    author_name: z.string().optional(),
    date: z.string().optional(),
    alt: z.string().optional(),
    poster: MediaRefSchema.nullish(),
  }),
);
