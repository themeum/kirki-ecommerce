import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';
import { z } from 'zod';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DefaultSchema = z.ZodObject<any> | z.ZodEffects<z.ZodTypeAny>;

function getShape(schema: z.ZodTypeAny): z.ZodRawShape {
  if (schema instanceof z.ZodEffects) {
    return getShape(schema._def.schema);
  }
  return (schema as z.ZodObject<z.ZodRawShape>).shape;
}

function getDefaults<Schema extends DefaultSchema>(schema: Schema) {
  const entries = Object.entries(getShape(schema)).map(([key, value]) => {
    if (value instanceof z.ZodDefault) {
      return [key, value._def.defaultValue()] as [string, unknown];
    }
    return [key, undefined] as [string, unknown];
  });
  return Object.fromEntries(entries) as z.input<Schema>;
}

function pickFormValues<Schema extends DefaultSchema>(
  schema: Schema,
  source: Record<string, unknown>,
  overrides: Partial<z.input<Schema>> = {},
): z.input<Schema> {
  const shape = getShape(schema);
  const picked = Object.keys(shape).reduce<Record<string, unknown>>((acc, key) => {
    if (key in source) {
      acc[key] = source[key];
    }
    return acc;
  }, {});

  return { ...picked, ...overrides } as z.input<Schema>;
}

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === 'string') {
    return value.trim() === '';
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  return false;
}

function required<Base extends z.ZodTypeAny>(schema: Base, message?: string) {
  if (!isDefined(message)) {
    message = __('This field is required', 'kirki-ecommerce');
  }

  return schema.nullish().refine((value): value is z.output<Base> => !isEmptyValue(value), { message });
}

type RequiredWhenValidate = (values: Record<string, unknown>, ctx: z.RefinementCtx) => boolean;

type RequiredWhenRule = {
  isValidationFailed: RequiredWhenValidate;
  message: string;
};

const requiredWhenRules = new WeakMap<z.ZodTypeAny, RequiredWhenRule[]>();

function requiredWhen<Base extends z.ZodTypeAny>(schema: Base, isValidationFailed: RequiredWhenValidate, message?: string) {
  if (!isDefined(message)) {
    message = __('Validation failed.', 'kirki-ecommerce');
  }
  const rules = requiredWhenRules.get(schema) ?? [];
  rules.push({ isValidationFailed, message });
  requiredWhenRules.set(schema, rules);
  return schema;
}

function prepareFormSchema<Schema extends z.AnyZodObject>(
  schema: Schema,
): Schema | z.ZodEffects<Schema, z.output<Schema>, z.input<Schema>> {
  const shape = getShape(schema);
  const hasRules = Object.values(shape).some((fieldSchema) => requiredWhenRules.has(fieldSchema));

  if (!hasRules) {
    return schema;
  }

  return schema.superRefine((values, ctx) => {
    Object.entries(shape).forEach(([key, fieldSchema]) => {
      const rules = requiredWhenRules.get(fieldSchema);
      if (!rules) {
        return;
      }
      rules.forEach(({ isValidationFailed, message }) => {
        if (isValidationFailed(values as Record<string, unknown>, ctx)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key], message });
        }
      });
    });
  });
}

export { getDefaults, isEmptyValue, pickFormValues, prepareFormSchema, required, requiredWhen };

