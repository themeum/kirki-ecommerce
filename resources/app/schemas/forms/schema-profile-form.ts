import { z } from 'zod';

import { prepareFormSchema, required } from '@/libs/zod';
import { __ } from '@/wpi18n';

const SchemaProfileFormShape = z.object({
  name: required(z.string().default(''), __('Schema name cannot be empty', 'kirki-ecommerce')),
  schema: z.record(z.array(z.string())).refine(
    (value) => Object.keys(value).length > 0,
    {
      message: __('Select at least one schema field', 'kirki-ecommerce'),
    },
  ),
  is_default: z.boolean().default(false),
});

const SchemaProfileFormSchema = prepareFormSchema(SchemaProfileFormShape).transform((values) => ({
  name: values.name,
  schema: values.schema,
  is_default: values.is_default,
}));

type SchemaProfileFormInput = z.input<typeof SchemaProfileFormSchema>;

type SchemaProfileFormPayload = z.output<typeof SchemaProfileFormSchema>;

export {
  SchemaProfileFormSchema,
  type SchemaProfileFormInput,
  type SchemaProfileFormPayload,
};
