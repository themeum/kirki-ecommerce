import type { Attribute } from '@/schemas/catalog/attribute';
import {
  normalizeDefaultVariant,
  type ProductFormVariantInput,
} from '@/schemas/forms/product-form';

type MatrixAttribute = Pick<Attribute, 'id' | 'name'> & {
  values?: Attribute['values'];
};

type SyncVariantMatrixArgs = {
  attributes: MatrixAttribute[];
  previousAttributes: MatrixAttribute[];
  variants: ProductFormVariantInput[];
};

type SyncVariantMatrixResult = {
  variants: ProductFormVariantInput[];
  discarded: ProductFormVariantInput[];
};

export const buildCombinations = (attributes: MatrixAttribute[]): number[][] => {
  return attributes.reduce<number[][]>(
    (combinations, attribute) => {
      const valueIds = (attribute.values ?? []).map((value) => value.id);
      return combinations.flatMap((combination) =>
        valueIds.map((valueId) => [...combination, valueId]),
      );
    },
    [[]],
  );
};

const buildValueOwners = (
  attributes: MatrixAttribute[],
): Map<number, number> => {
  const owners = new Map<number, number>();
  for (const attribute of attributes) {
    for (const value of attribute.values ?? []) {
      owners.set(value.id, attribute.id);
    }
  }
  return owners;
};

/**
 * A saved variant fits a combination when every value it still owns is present
 * in that combination. A value whose attribute was removed outright imposes no
 * constraint — that is how a variant collapses onto a shorter combination. A
 * value whose attribute survived but which was itself deselected can never be
 * satisfied, which is what discards that variant instead of letting it drift
 * onto a slot belonging to another one.
 */
const fitsCombination = (
  attributeValues: number[],
  combination: number[],
  liveAttributeIds: Set<number>,
  previousOwners: Map<number, number>,
): boolean => {
  return attributeValues.every((valueId) => {
    const ownerId = previousOwners.get(valueId);
    if (ownerId === undefined || !liveAttributeIds.has(ownerId)) {
      return true;
    }
    return combination.includes(valueId);
  });
};

const countSharedValues = (
  attributeValues: number[],
  combination: number[],
): number => {
  return attributeValues.filter((valueId) => combination.includes(valueId))
    .length;
};

/**
 * Fields a generated variant takes from the surviving variant it descends from.
 * Identity (`id`, `sku`, `barcode`) and stock (`available_quantity`,
 * `committed_quantity`) are deliberately absent: SKU is globally unique in the
 * database, and inheriting stock would multiply the same physical units across
 * every generated row.
 */
const inheritFromTemplate = (
  template: ProductFormVariantInput,
  combination: number[],
): ProductFormVariantInput => ({
  ...template,
  id: undefined,
  attribute_values: combination,
  sku: null,
  barcode: null,
  available_quantity: 0,
  committed_quantity: 0,
  is_default: false,
});

export const syncVariantMatrix = ({
  attributes,
  previousAttributes,
  variants,
}: SyncVariantMatrixArgs): SyncVariantMatrixResult => {
  const combinations = buildCombinations(attributes);
  const liveAttributeIds = new Set(attributes.map((attribute) => attribute.id));
  const previousOwners = buildValueOwners([
    ...previousAttributes,
    ...attributes,
  ]);

  const claimedBy = new Map<number, ProductFormVariantInput>();
  const discarded: ProductFormVariantInput[] = [];

  for (const variant of variants) {
    const attributeValues = variant.attribute_values ?? [];
    const claimIndex = combinations.findIndex(
      (combination, index) =>
        !claimedBy.has(index) &&
        fitsCombination(
          attributeValues,
          combination,
          liveAttributeIds,
          previousOwners,
        ),
    );

    if (claimIndex === -1) {
      discarded.push(variant);
      continue;
    }

    claimedBy.set(claimIndex, {
      ...variant,
      attribute_values: combinations[claimIndex],
    });
  }

  const survivors = [...claimedBy.values()];

  const nextVariants = combinations.map((combination, index) => {
    const claimed = claimedBy.get(index);
    if (claimed) {
      return claimed;
    }

    const template = survivors.reduce<ProductFormVariantInput | undefined>(
      (best, candidate) => {
        if (!best) {
          return candidate;
        }
        const bestScore = countSharedValues(
          best.attribute_values ?? [],
          combination,
        );
        const candidateScore = countSharedValues(
          candidate.attribute_values ?? [],
          combination,
        );
        return candidateScore > bestScore ? candidate : best;
      },
      undefined,
    );

    return inheritFromTemplate(template ?? variants[0], combination);
  });

  return { variants: normalizeDefaultVariant(nextVariants), discarded };
};

export const formatComboLabel = (
  attributes: MatrixAttribute[],
  attributeValues: number[],
): string => {
  const selected = new Set(attributeValues);

  return attributes
    .flatMap((attribute) =>
      (attribute.values ?? []).filter((value) => selected.has(value.id)),
    )
    .map((value) => value.value)
    .join(' / ');
};
