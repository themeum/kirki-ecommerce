import type { CouponListItem } from '@/features/coupons/schemas/catalog/coupon';
import type {
  OrderCalculationItem,
  OrderCoupon,
  OrderEditLineItem,
} from '@/features/orders/schemas/catalog/order';
import type { OrderFormInput } from '@/features/orders/schemas/forms/order-form';
import type { OrderItem, OrderRowDisplay } from '@/features/orders/types';
import type { ProductSelection } from '@/features/products';
import { isDefined } from '@/utils/object';
import { __, sprintf } from '@/wpi18n';

type PickedItem = OrderFormInput['items'][number];

type QuantityLimitSource = {
  inStock?: boolean | null;
  trackInventory?: boolean | null;
  allowBackOrder?: boolean | null;
  availableQuantity?: number | null;
  hasLimitPerOrder?: boolean | null;
  maxPerOrder?: number | null;
};

const flattenSelections = (selections: ProductSelection[]): OrderRowDisplay[] =>
  selections.flatMap(({ productId, productTitle, variants }) =>
    variants.map((variant) => ({ ...variant, productId, productTitle })),
  );

const toStoredRowDisplay = (item: OrderEditLineItem): OrderRowDisplay => {
  const unitPrice = item.base_unit_price_money_object;
  const strikethroughPrice = item.base_unit_strikethrough_price_money_object;

  return {
    productId: item.product_id ?? null,
    productTitle: item.product_name ?? '',
    variantId: item.variant_id ?? null,
    variantLabel: item.variant_name ?? '',
    thumbnail: item.image?.url ?? null,
    inStock: item.in_stock ?? true,
    availableQuantity: item.available_quantity ?? 0,
    allowBackOrder: item.allow_back_order ?? true,
    trackInventory: item.track_inventory ?? false,
    hasLimitPerOrder: item.has_limit_per_order ?? false,
    maxPerOrder: item.max_per_order ?? null,
    regularPrice: strikethroughPrice ?? unitPrice,
    salePrice: isDefined(strikethroughPrice) ? unitPrice : null,
    storedQuantity: item.quantity,
    storedSubtotal: item.base_subtotal_money_object,
    isReachable: item.is_reachable,
  };
};

const getOrderRows = (
  pickedItems: PickedItem[],
  selections: ProductSelection[],
  storedItems: OrderEditLineItem[],
): OrderItem[] => {
  const displayByVariantId = new Map(
    flattenSelections(selections).map((display) => [display.variantId, display]),
  );
  const storedItemById = new Map(storedItems.map((item) => [item.id, item]));

  return pickedItems.reduce<OrderItem[]>((acc, pickedItem, index) => {
    const storedItem = isDefined(pickedItem.id) ? storedItemById.get(pickedItem.id) : undefined;
    const display =
      (isDefined(pickedItem.variant_id) ? displayByVariantId.get(pickedItem.variant_id) : undefined) ??
      (storedItem ? toStoredRowDisplay(storedItem) : undefined);

    if (display) {
      acc.push({ index, quantity: pickedItem.quantity, display });
    }

    return acc;
  }, []);
};

const toSelectedCoupon = (coupon: OrderCoupon): CouponListItem => {
  const fixedAmount = coupon.base_discount_amount_fixed_money_object;
  const amount = fixedAmount ?? coupon.base_discount_amount_money_object;

  return {
    id: coupon.coupon_id ?? coupon.id,
    method: 'code',
    title: coupon.title ?? coupon.code,
    code: coupon.code,
    discount_type: coupon.discount_type,
    discount_target: coupon.discount_target,
    discount_value_type: coupon.discount_value_type,
    base_discount_amount:
      coupon.discount_value_type === 'percentage'
        ? coupon.discount_amount_percentage
        : (fixedAmount?.raw ?? null),
    base_discount_amount_money_object: amount,
    display_discount_amount: amount.raw,
    display_discount_amount_money_object: amount,
    has_end_datetime: false,
    has_usage_limit: false,
    current_usage_count: 0,
    is_active: true,
    status: 'active',
  };
};

const toPickedItem = (pickedItem: PickedItem): PickedItem => {
  if (isDefined(pickedItem.id)) {
    return { id: pickedItem.id, variant_id: pickedItem.variant_id, quantity: pickedItem.quantity };
  }

  return { variant_id: pickedItem.variant_id, quantity: pickedItem.quantity };
};

/**
 * `nextSelections` is the full new set from the product picker, not an
 * incremental delta — variants missing from it are dropped, variants already
 * picked keep their existing quantity, and newly-picked variants start at 1.
 * A stored line (one with an `id`) is never in the picker, so it is always kept.
 */
const mergeSelections = (
  pickedItems: PickedItem[],
  nextSelections: ProductSelection[],
): PickedItem[] => {
  const items = flattenSelections(nextSelections);
  const selectedVariantIds = new Set(items.map((item) => item.variantId));
  const existingVariantIds = new Set(pickedItems.map((pickedItem) => pickedItem.variant_id));

  const kept = pickedItems
    .filter(
      (pickedItem) =>
        isDefined(pickedItem.id) || selectedVariantIds.has(pickedItem.variant_id ?? null),
    )
    .map(toPickedItem);

  const added = items
    .filter((item) => !existingVariantIds.has(item.variantId))
    .map((item) => ({ variant_id: item.variantId, quantity: 1 }));

  return [...kept, ...added];
};

type QuantityLimit = {
  max: number;
  reason: string;
};

const toQuantityLimitSource = (item: OrderCalculationItem): QuantityLimitSource => ({
  inStock: item.in_stock,
  trackInventory: item.track_inventory,
  allowBackOrder: item.allow_back_order,
  availableQuantity: item.available_quantity,
  hasLimitPerOrder: item.has_limit_per_order,
  maxPerOrder: item.max_per_order,
});

/**
 * The stock ceiling only applies when the variant's inventory is actually
 * tracked and it isn't backorder-eligible; the per-order limit is
 * independent of stock. When both apply, the stricter (smaller) ceiling wins
 * (a tie is reported as a stock limit). A stored line never has a ceiling
 * below its stored quantity, so an unchanged line always saves.
 */
const getQuantityLimit = (
  source: QuantityLimitSource,
  storedQuantity?: number,
): QuantityLimit | undefined => {
  const stockLimit =
    source.trackInventory && !source.allowBackOrder
      ? (source.availableQuantity ?? undefined)
      : undefined;
  const orderLimit = source.hasLimitPerOrder ? (source.maxPerOrder ?? undefined) : undefined;

  let limit: QuantityLimit | undefined;

  if (isDefined(stockLimit) && (!isDefined(orderLimit) || stockLimit <= orderLimit)) {
    limit = {
      max: stockLimit,
      reason:
        source.inStock === false
          ? __('Out of stock', 'kirki-ecommerce')
          : sprintf(__('Only %s left in stock', 'kirki-ecommerce'), stockLimit),
    };
  } else if (isDefined(orderLimit)) {
    limit = {
      max: orderLimit,
      reason: sprintf(__('Limited to %s per order', 'kirki-ecommerce'), orderLimit),
    };
  }

  if (isDefined(limit) && isDefined(storedQuantity) && limit.max < storedQuantity) {
    return { ...limit, max: storedQuantity };
  }

  return limit;
};

const getMaxQuantity = (source: QuantityLimitSource): number | undefined =>
  getQuantityLimit(source)?.max;

/**
 * Stored lines pair with calculation items by their `id`; new lines pair with
 * the id-less calculation items in the order they were added.
 */
const pairCalculationItems = (
  pickedItems: PickedItem[],
  calculationItems: OrderCalculationItem[],
): (OrderCalculationItem | undefined)[] => {
  const itemById = new Map<number, OrderCalculationItem>();
  const newItems: OrderCalculationItem[] = [];

  calculationItems.forEach((calculationItem) => {
    if (isDefined(calculationItem.id)) {
      itemById.set(calculationItem.id, calculationItem);
      return;
    }

    newItems.push(calculationItem);
  });

  let newItemIndex = 0;

  return pickedItems.map((pickedItem) => {
    if (isDefined(pickedItem.id)) {
      return itemById.get(pickedItem.id);
    }

    const calculationItem = newItems[newItemIndex];
    newItemIndex += 1;

    return calculationItem;
  });
};

export {
  flattenSelections,
  getMaxQuantity,
  getOrderRows,
  getQuantityLimit,
  mergeSelections,
  pairCalculationItems,
  type PickedItem,
  type QuantityLimit,
  type QuantityLimitSource,
  toQuantityLimitSource,
  toSelectedCoupon,
  toStoredRowDisplay,
};
