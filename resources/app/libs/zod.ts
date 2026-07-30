import { z } from 'zod';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDefaults<Schema extends z.ZodObject<any>>(schema: Schema) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const entries = Object.entries(schema.shape).map(([key, value]) => {
    if (value instanceof z.ZodDefault) {
      return [key, value._def.defaultValue()] as [string, unknown];
    }
    return [key, null] as [string, unknown];
  });
  return Object.fromEntries(entries) as z.infer<Schema>;
}

export { getDefaults };