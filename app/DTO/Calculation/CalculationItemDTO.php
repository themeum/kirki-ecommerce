<?php

namespace Kirki\Ecommerce\App\DTO\Calculation;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\DTO;

/**
 * A line item passed through price calculation, carrying its base-currency subtotal, tax and discount amounts.
 *
 * @since 1.0.0
 */
class CalculationItemDTO extends DTO
{
    /** @var int|string Key that tells this line from the other lines of the same calculation; results are keyed by it. For an order it is the position of the line in the payload; for a cart it is the cart item ID */
    public $line_key;
    /** @var int|null Stored order line this item is, when an order is being edited */
    public $order_item_id;
    /** @var int|null Variant of the line; empty for a stored line whose variant was deleted */
    public $variant_id;
    /** @var int|null */
    public $product_id;
    /** @var bool False when the line's variant or product was deleted, or the product can no longer be bought */
    public $is_reachable = true;
    /** @var int */
    public $quantity;
    /** @var int */
    public $base_unit_price;
    /** @var int */
    public $weight;
    /** @var string|null Unit of `weight`; empty when the variant has none */
    public $weight_unit;
    /** @var int */
    public $shipping_profile_id;
    /** @var int|null */
    public $tax_profile_id;
    /** @var array */
    public $product_categories = [];
    /** @var array */
    public $meta = [];
    /** @var int */
    public $base_subtotal = 0;
    /** @var int */
    public $base_tax_amount = 0;
    /** @var \Kirki\Ecommerce\App\DTO\Tax\TaxLineDTO[] */
    public $tax_lines = [];
    /** @var int */
    public $base_discount_amount = 0;
    /** @var int */
    public $base_total = 0;
    /** @var int */
    public $base_product_total = 0;
    /** @var int */
    public $base_regular_unit_price = 0;
    /** @var int */
    public $base_regular_tax_amount = 0;
    /** @var int */
    public $base_catalog_regular_price = 0;
    /** @var int */
    public $base_catalog_sale_price = 0;
    /** @var int */
    public $base_catalog_product_coupon_discounted_subtotal = 0;
    /** @var int */
    public $base_discount_tax_amount = 0;
}
