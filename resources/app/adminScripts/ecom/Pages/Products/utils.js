export const createVariantCombinations = (attributes, variants) => {
  let combinations = [];
  const baseVariant = { ...variants[0] } || {};
  delete baseVariant.id;

  // Extract array of IDs per attribute: e.g. [[1,2], [4,5]]
  const attributesValues = attributes.map((attr) =>
    attr.values.map((v) => v.id)
  );

  // Generate cartesian product
  const generateCombinations = (attrs, index = 0, current = []) => {
    if (index === attrs.length) {
      combinations.push([...current]);
      return;
    }
    for (let val of attrs[index]) {
      current.push(val);
      generateCombinations(attrs, index + 1, current);
      current.pop();
    }
  };

  generateCombinations(attributesValues);

  // Map combinations to variant objects
  const mapped = combinations.map((combo) => {
    // Try to find existing variant by attribute_values
    const existingVariant = variants.find(
      (v) =>
        Array.isArray(v.attribute_values) &&
        v.attribute_values.length === combo.length &&
        combo.every((id) => v.attribute_values.includes(id))
    );

    if (existingVariant) return existingVariant;

    // Create new clean variant object
    return {
      ...baseVariant, // clone base structure if needed
      attribute_values: combo, // IDs only, as requested
    };
  });
  return mapped;
};

export const getAttributeById = (attributes, id) => {
  return attributes.find((attr) => attr.id === id);
};

export const getAttributeByValueId = (attributes, valueId) => {
  // loop attributes then loop values to find value
  for (let attr of attributes) {
    for (let value of attr.values) {
      if (value.id === valueId) {
        return value;
      }
    }
  }
  return null;
};

export const generateVariantIndexes = (variants, arr) => {
  const variant_indexes = variants
    .map((variant, index) => {
      const values = new Set(variant.attribute_values);
      const containsAll = [...arr].every((v) => values.has(v));
      return containsAll ? index : null;
    })
    .filter((index) => index !== null);

  return variant_indexes;
};

export const generateVariantIndexById = (variants, id) => {
  return [variants.findIndex((variant) => variant?.id === id)];
};
