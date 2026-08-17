import type { OrderItem, OrderRowDisplay } from '@/features/orders/types';
import type { ProductSelection } from '@/features/products';

type PickedItem = {
  variant_id: number;
  quantity: number;
};

const flattenSelections = (selections: ProductSelection[]): OrderRowDisplay[] =>
  selections.flatMap(({ productId, productTitle, variants }) =>
    variants.map((variant) => ({ ...variant, productId, productTitle })),
  );

const getDisplayByVariantId = (
  selections: ProductSelection[],
): Record<number, OrderRowDisplay> =>
  flattenSelections(selections).reduce<Record<number, OrderRowDisplay>>(
    (acc, display) => {
      acc[display.variantId] = display;
      return acc;
    },
    {},
  );

const getOrderRows = (
  pickedItems: PickedItem[],
  displayByVariantId: Record<number, OrderRowDisplay>,
): OrderItem[] =>
  pickedItems.reduce<OrderItem[]>((acc, pickedItem, index) => {
    const display = displayByVariantId[pickedItem.variant_id];

    if (display) {
      acc.push({ index, quantity: pickedItem.quantity, display });
    }

    return acc;
  }, []);

/**
 * `nextSelections` is the full new set from the product picker, not an
 * incremental delta — variants missing from it are dropped, variants already
 * picked keep their existing quantity, and newly-picked variants start at 1.
 */
const mergeSelections = (
  pickedItems: PickedItem[],
  nextSelections: ProductSelection[],
): PickedItem[] => {
  const items = flattenSelections(nextSelections);
  const selectedVariantIds = new Set(items.map((item) => item.variantId));
  const existingVariantIds = new Set(pickedItems.map((pickedItem) => pickedItem.variant_id));

  const kept = pickedItems
    .filter((pickedItem) => selectedVariantIds.has(pickedItem.variant_id))
    .map((pickedItem) => ({ variant_id: pickedItem.variant_id, quantity: pickedItem.quantity }));

  const added = items
    .filter((item) => !existingVariantIds.has(item.variantId))
    .map((item) => ({ variant_id: item.variantId, quantity: 1 }));

  return [...kept, ...added];
};

export { flattenSelections, getDisplayByVariantId, getOrderRows, mergeSelections, type PickedItem };
