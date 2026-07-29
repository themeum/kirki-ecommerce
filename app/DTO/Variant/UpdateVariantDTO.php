<?php

namespace Kirki\Ecommerce\App\DTO\Variant;

use Kirki\Ecommerce\Framework\DTO;

class UpdateVariantDTO extends DTO
{
    /** @var int */
    public $id;

    /** @var int|null */
    public $media;

    /** @var int[] */
    public $attribute_values = [];

    /** @var string|null */
    public $sku;

    /** @var string|null */
    public $barcode;

    /** @var int|null */
    public $price;

    /** @var bool|null */
    public $show_unit_price;

    /** @var string|null */
    public $base_unit;

    /** @var int|null */
    public $base_unit_amount;

    /** @var string|null */
    public $total_unit;

    /** @var int|null */
    public $total_unit_amount;

    /** @var int|null */
    public $sale_price;

    /** @var int|null */
    public $cost_of_goods;

    /** @var float|null */
    public $weight;

    /** @var string|null */
    public $weight_unit;

    /** @var bool|null */
    public $charge_taxes = false;

    /** @var bool|null */
    public $allow_back_order = false;

    /** @var bool|null */
    public $track_inventory = false;

    /** @var int|null */
    public $available_quantity;

    /** @var bool|null */
    public $in_stock = true;

    /** @var int|null */
    public $committed_quantity = 0;

    /** @var bool|null */
    public $has_limit_per_order = false;

    /** @var int|null */
    public $max_per_order;

    /** @var int|null */
    public $tax_profile_id;

    /** @var int|null */
    public $shipping_profile_id;

    /** @var int|null */
    public $shipping_box_id;

    /** @var bool|null */
    public $is_visible = true;

    /** @var bool|null */
    public $is_physical_product = true;

    /** @var bool|null */
    public $is_default = false;

    /** @var int|null */
    public $product_id;
}
