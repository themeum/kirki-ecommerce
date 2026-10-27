import { z } from 'zod';

import type { Attribute } from '@/features/products/schemas/catalog/attribute';
import { prepareFormSchema, required } from '@/libs/zod';
import { __ } from '@/wpi18n';

const ProductAttributeValueFormShape = z.object({
  id: z.number().optional(),
  value: z.string(),
  color: z.string().nullish(),
  original_color: z.string().nullish(),
});

const ProductAttributeFormShape = z.object({
  source_attribute_id: z.number().nullish(),
  source_name: z.string().nullish(),
  name: required(z.string().default(''), __('Variation name is required', 'kirki-ecommerce')),
  type: z.string().nullish(),
  values: z
    .array(ProductAttributeValueFormShape)
    .min(1, __('Add at least one variation value', 'kirki-ecommerce')),
});

const normalizeName = (name?: string | null) => (name ?? '').trim().toLowerCase();

const colorOrNull = (color?: string | null) => color || null;

/**
 * Turns the card's draft into what Apply has to write. A card that did not
 * start from an attribute, or whose name changed, becomes a new attribute
 * carrying every selected value; otherwise only the draft values and the
 * recolored ones are sent for the existing attribute.
 */
export const ProductAttributeFormSchema = prepareFormSchema(ProductAttributeFormShape).transform((values) => {
  const isRenamed =
    !values.source_attribute_id || normalizeName(values.name) !== normalizeName(values.source_name);

  if (isRenamed) {
    return {
      kind: 'create' as const,
      name: values.name.trim(),
      type: values.type || 'list',
      replaces: values.source_attribute_id ?? null,
      values: values.values.map((item) => ({
        value: item.value,
        color: colorOrNull(item.color),
      })),
    };
  }

  return {
    kind: 'sync' as const,
    attribute_id: values.source_attribute_id!,
    create: values.values
      .filter((item) => item.id === undefined)
      .map((item) => ({ value: item.value, color: colorOrNull(item.color) })),
    update: values.values
      .filter((item) => item.id !== undefined && colorOrNull(item.color) !== colorOrNull(item.original_color))
      .map((item) => ({ id: item.id!, color: colorOrNull(item.color) })),
  };
});

export type ProductAttributeFormInput = z.input<typeof ProductAttributeFormSchema>;

export type ProductAttributeFormPayload = z.output<typeof ProductAttributeFormSchema>;

export type ProductAttributeValueInput = z.input<typeof ProductAttributeValueFormShape>;

export const duplicateAttributeNameMessage = () =>
  __('An attribute with this name already exists.', 'kirki-ecommerce');

/**
 * Finds an existing attribute, other than the one the card started from,
 * whose name matches ignoring case and surrounding whitespace.
 */
export const findAttributeNameClash = <TAttribute extends Pick<Attribute, 'id' | 'name'>>(
  name: string | null | undefined,
  attributes: TAttribute[],
  sourceAttributeId?: number | null,
) => {
  const needle = normalizeName(name);

  if (!needle) {
    return undefined;
  }

  return attributes.find(
    (attribute) => attribute.id !== sourceAttributeId && normalizeName(attribute.name) === needle,
  );
};

export const attributeAlreadyAddedMessage = () =>
  __('This attribute is already added to this product.', 'kirki-ecommerce');

export const attributeNameClashMessage = (kind: 'selected-clash' | 'applied-clash') =>
  kind === 'applied-clash' ? attributeAlreadyAddedMessage() : duplicateAttributeNameMessage();

type ClassifyAttributeNameArgs<TAttribute extends Pick<Attribute, 'id' | 'name'>> = {
  name: string | null | undefined;
  attributes: TAttribute[];
  sourceAttributeId?: number | null;
  appliedIds: number[];
  selectedCount: number;
};

/**
 * Decides what a typed name means: no match, an attribute the card can switch
 * to, a match blocked by values already selected, or a match that is already
 * on the product in another card.
 */
export const classifyAttributeName = <TAttribute extends Pick<Attribute, 'id' | 'name'>>({
  name,
  attributes,
  sourceAttributeId,
  appliedIds,
  selectedCount,
}: ClassifyAttributeNameArgs<TAttribute>): { kind: 'none' } | { kind: 'reuse' | 'selected-clash' | 'applied-clash'; attribute: TAttribute } => {
  const attribute = findAttributeNameClash(name, attributes, sourceAttributeId);

  if (!attribute) {
    return { kind: 'none' };
  }

  if (appliedIds.includes(attribute.id)) {
    return { kind: 'applied-clash', attribute };
  }

  if (selectedCount > 0) {
    return { kind: 'selected-clash', attribute };
  }

  return { kind: 'reuse', attribute };
};

/**
 * Builds the draft form values for a card opened from an existing attribute
 * (applied, preset or picked from `+ Add`), or an empty new-attribute draft.
 */
export const toProductAttributeFormValues = (
  source?: Pick<Attribute, 'id' | 'name' | 'type' | 'values'> | null,
  selectedValues: Attribute['values'] = [],
): ProductAttributeFormInput => ({
  source_attribute_id: source?.id ?? null,
  source_name: source?.name ?? null,
  name: source?.name ?? '',
  type: source?.type ?? 'list',
  values: (selectedValues ?? []).map((item) => ({
    id: item.id,
    value: item.value,
    color: item.color ?? null,
    original_color: item.color ?? null,
  })),
});
