import type { ProductVariant } from '@/features/products';
import { isDefined } from '@/utils/object';

type BulkEditPayloadVariant = Pick<
  ProductVariant,
  | 'id'
  | 'sku'
  | 'barcode'
  | 'base_price'
  | 'show_unit_price'
  | 'base_unit'
  | 'base_unit_amount'
  | 'total_unit'
  | 'total_unit_amount'
  | 'base_sale_price'
  | 'base_cost_of_goods'
  | 'weight'
  | 'weight_unit'
  | 'charge_taxes'
  | 'allow_back_order'
  | 'track_inventory'
  | 'available_quantity'
  | 'in_stock'
  | 'low_stock_threshold'
  | 'has_limit_per_order'
  | 'max_per_order'
  | 'tax_profile_id'
  | 'shipping_profile_id'
  | 'shipping_box_id'
  | 'is_visible'
  | 'is_physical_product'
  | 'is_default'
  | 'attribute_values'
> & { media: number | null };

type BulkEditPayload = {
  variants: BulkEditPayloadVariant[];
};

/**
 * Whitelists exactly the keys `BulkUpdateVariantRequest` accepts server-side,
 * so derived/read-only fields (`*_money_object`, `display_*`,
 * `committed_quantity`, timestamps) never round-trip in the request body.
 * Money stays in major units — the server converts via `Money::to_minor()`.
 */
const buildBulkEditPayload = (variants: ProductVariant[]): BulkEditPayload => ({
  variants: variants.map((variant) => ({
    id: variant.id!,
    media: isDefined(variant.media?.id) ? Number(variant.media.id) : null,
    sku: variant.sku,
    barcode: variant.barcode,
    base_price: variant.base_price,
    show_unit_price: variant.show_unit_price,
    base_unit: variant.base_unit,
    base_unit_amount: variant.base_unit_amount,
    total_unit: variant.total_unit,
    total_unit_amount: variant.total_unit_amount,
    base_sale_price: variant.base_sale_price,
    base_cost_of_goods: variant.base_cost_of_goods,
    weight: variant.weight,
    weight_unit: variant.weight_unit,
    charge_taxes: variant.charge_taxes,
    allow_back_order: variant.allow_back_order,
    track_inventory: variant.track_inventory,
    available_quantity: variant.available_quantity,
    in_stock: variant.in_stock,
    low_stock_threshold: variant.low_stock_threshold,
    has_limit_per_order: variant.has_limit_per_order,
    max_per_order: variant.max_per_order,
    tax_profile_id: variant.tax_profile_id,
    shipping_profile_id: variant.shipping_profile_id,
    shipping_box_id: variant.shipping_box_id,
    is_visible: variant.is_visible,
    is_physical_product: variant.is_physical_product,
    is_default: variant.is_default,
    attribute_values: variant.attribute_values,
  })),
});

export { buildBulkEditPayload };
export type { BulkEditPayload, BulkEditPayloadVariant };
