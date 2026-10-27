import type { Attribute } from '@/features/products/schemas/catalog/attribute';

const PRESET_COUNT = 3;

type AttributePresets = {
  presets: Attribute[];
  overflow: Attribute[];
};

/**
 * Splits the store's attributes into the preset buttons shown under the
 * variation cards and the overflow listed behind `+ Add`. Attributes already
 * on the product, or open in a draft card, are left out so the next ones by
 * id fill their place.
 */
export const selectAttributePresets = (
  attributes: Attribute[],
  unavailableIds: number[],
): AttributePresets => {
  const unavailable = new Set(unavailableIds);
  const available = attributes
    .filter((attribute) => !unavailable.has(attribute.id))
    .sort((first, second) => first.id - second.id);

  return {
    presets: available.slice(0, PRESET_COUNT),
    overflow: available.slice(PRESET_COUNT),
  };
};
