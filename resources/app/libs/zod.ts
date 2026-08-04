import type { MediaRef } from '@/schemas/shared/media';
import { isDefined } from '@/utils/object';
import { isMediaObject, isVideoObject } from '@/utils/media';
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

function unwrapToDefault(schema: z.ZodTypeAny): unknown {
  if (schema instanceof z.ZodDefault) {
    return schema._def.defaultValue();
  }
  if (schema instanceof z.ZodEffects) {
    return unwrapToDefault(schema._def.schema);
  }
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
    return unwrapToDefault(schema._def.innerType);
  }
  return undefined;
}

function getDefaults<Schema extends DefaultSchema>(schema: Schema) {
  const entries = Object.entries(getShape(schema)).map(([key, value]) => {
    return [key, unwrapToDefault(value)] as [string, unknown];
  });
  return Object.fromEntries(entries) as z.input<Schema>;
}

function pickFormValues<Schema extends DefaultSchema>(
  schema: Schema,
  source: Record<string, unknown>,
  overrides: Partial<z.input<Schema>> = {},
): z.input<Schema> {
  const defaults = getDefaults(schema) as Record<string, unknown>;
  const shape = getShape(schema);
  const picked = Object.keys(shape).reduce<Record<string, unknown>>((acc, key) => {
    acc[key] = key in source ? source[key] : defaults[key];
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

/**
 * `.describe()` returns a fresh schema instance (a shallow clone), which is
 * what lets us register a rule against a copy instead of the caller's shared
 * schema object. Without this, a shared field builder (e.g. `moneyAmount`)
 * would leak a `requiredWhen` rule into every form that imports it.
 */
function requiredWhen<Base extends z.ZodTypeAny>(schema: Base, isValidationFailed: RequiredWhenValidate, message?: string) {
  if (!isDefined(message)) {
    message = __('Validation failed.', 'kirki-ecommerce');
  }
  const cloned = schema.describe(schema.description ?? '') as Base;
  const rules = requiredWhenRules.get(cloned) ?? [];
  rules.push({ isValidationFailed, message });
  requiredWhenRules.set(cloned, rules);
  return cloned;
}

/**
 * `isValidationFailed` always receives the ROOT form values, even for a
 * rule registered on a deeply nested field — a nested field's condition
 * commonly depends on a top-level sibling (e.g. `billing_address.postal_code`
 * required unless the root `is_billing_same_as_shipping` is true). `values`
 * is threaded through only to know where in the tree to recurse next.
 */
function collectIssuesForShape(
  shape: z.ZodRawShape,
  values: Record<string, unknown>,
  rootValues: Record<string, unknown>,
  ctx: z.RefinementCtx,
  path: (string | number)[],
) {
  Object.entries(shape).forEach(([key, fieldSchema]) => {
    const rules = requiredWhenRules.get(fieldSchema);
    if (rules) {
      rules.forEach(({ isValidationFailed, message }) => {
        if (isValidationFailed(rootValues, ctx)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: [...path, key], message });
        }
      });
    }

    const nestedValue = values?.[key];
    const nestedShape = getNestedShape(fieldSchema);
    if (nestedShape && nestedValue && typeof nestedValue === 'object' && !Array.isArray(nestedValue)) {
      collectIssuesForShape(nestedShape, nestedValue as Record<string, unknown>, rootValues, ctx, [...path, key]);
    }
  });
}

function getNestedShape(schema: z.ZodTypeAny): z.ZodRawShape | undefined {
  let unwrapped = schema;
  while (
    unwrapped instanceof z.ZodOptional ||
    unwrapped instanceof z.ZodNullable ||
    unwrapped instanceof z.ZodDefault
  ) {
    unwrapped = unwrapped._def.innerType;
  }
  if (unwrapped instanceof z.ZodEffects) {
    unwrapped = unwrapped._def.schema;
  }
  if (unwrapped instanceof z.ZodObject) {
    return unwrapped.shape;
  }
  return undefined;
}

function shapeHasRules(shape: z.ZodRawShape): boolean {
  return Object.values(shape).some((fieldSchema) => {
    if (requiredWhenRules.has(fieldSchema)) {
      return true;
    }
    const nestedShape = getNestedShape(fieldSchema);
    return nestedShape ? shapeHasRules(nestedShape) : false;
  });
}

function prepareFormSchema<Schema extends z.AnyZodObject>(
  schema: Schema,
): Schema | z.ZodEffects<Schema, z.output<Schema>, z.input<Schema>> {
  const shape = getShape(schema);

  if (!shapeHasRules(shape)) {
    return schema;
  }

  return schema.superRefine((values, ctx) => {
    const rootValues = values as Record<string, unknown>;
    collectIssuesForShape(shape, rootValues, rootValues, ctx, []);
  });
}

/**
 * Field-level payload helpers. These are the named replacement for what
 * `processPayload` used to do silently to every outgoing request body — the
 * conversion now happens inside the schema transform and is visible in the
 * declared payload type.
 */

function mediaId() {
  return z
    .custom<MediaRef | number | string>()
    .nullish()
    .transform((value): number | { id: number; poster: number | null } | null => {
      if (value === null || value === undefined || value === '') {
        return null;
      }
      if (typeof value === 'number' || typeof value === 'string') {
        return Number(value);
      }
      if (isMediaObject(value)) {
        if (isVideoObject(value)) {
          return {
            id: Number(value.id),
            poster: isDefined(value.poster?.id) ? Number(value.poster.id) : null,
          };
        }
        return Number(value.id);
      }
      return null;
    });
}

function dateString() {
  return z
    .union([z.date(), z.string()])
    .nullish()
    .transform((value): string | null => {
      if (!isDefined(value) || value === '') {
        return null;
      }
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    });
}

function numberOrNull() {
  return z
    .union([z.number(), z.string(), z.null()])
    .nullish()
    .transform((value): number | null => {
      if (value === null || value === undefined || value === '') {
        return null;
      }
      const parsed = Number(value);
      return Number.isNaN(parsed) ? null : parsed;
    });
}

function booleanish(defaultValue = false) {
  return z
    .union([z.boolean(), z.string()])
    .nullish()
    .transform((value): boolean => {
      if (value === null || value === undefined) {
        return defaultValue;
      }
      if (typeof value === 'string') {
        return value.toLowerCase() !== 'false';
      }
      return value;
    });
}

export {
  booleanish,
  dateString,
  getDefaults,
  isEmptyValue,
  mediaId,
  numberOrNull,
  pickFormValues,
  prepareFormSchema,
  required,
  requiredWhen,
};
