import { useFormContext } from 'react-hook-form';

import { formatComboLabel, syncVariantMatrix } from '@/pages/products/variant-matrix';
import type {
  ProductFormInput,
  ProductFormVariantInput,
} from '@/schemas/forms/product-form';
import type { Attribute } from '@/types';

type AttributeList = NonNullable<ProductFormInput['attributes']>;

/**
 * A mutation that has been resolved but not written yet. `discarded` lets the
 * caller warn before saved variants are dropped; nothing reaches form state
 * until `commit` runs.
 */
export type MatrixMutation = {
  discarded: ProductFormVariantInput[];
  commit: () => void;
};

export const savedVariants = (variants: ProductFormVariantInput[]) =>
  variants.filter((item) => Boolean(item.id));

export const useVariantMatrix = () => {
  const { getValues, setValue } = useFormContext<ProductFormInput>();

  const prepare = (nextAttributes: AttributeList): MatrixMutation => {
    const previousAttributes = (getValues('attributes') ?? []);
    const { variants, discarded } = syncVariantMatrix({
      attributes: nextAttributes,
      previousAttributes,
      variants: getValues('variants') ?? [],
    });

    return {
      discarded,
      commit: () => {
        setValue('attributes', nextAttributes, { shouldDirty: true });
        setValue('variants', variants, { shouldDirty: true });
        setValue('has_variants', nextAttributes.length > 0, {
          shouldDirty: true,
        });
      },
    };
  };

  const currentAttributes = () => (getValues('attributes') ?? []);

  return {
    /**
     * Labels are built from the attributes still in form state — a mutation is
     * described before it is committed, so the removed attribute's values are
     * still resolvable.
     */
    describeDiscarded: (discarded: ProductFormVariantInput[]) =>
      discarded
        .map((item) =>
          formatComboLabel(currentAttributes(), item.attribute_values ?? []),
        )
        .filter(Boolean)
        .join(', '),

    addAttribute: (attribute: Attribute) =>
      prepare([...currentAttributes(), attribute]),

    updateAttribute: (attribute: Attribute) =>
      prepare(
        currentAttributes().map((item) =>
          item.id === attribute.id ? attribute : item,
        ),
      ),

    removeAttribute: (id: number) =>
      prepare(currentAttributes().filter((item) => item.id !== id)),

    reorderAttributes: (attributes: AttributeList) => prepare(attributes),
  };
};
