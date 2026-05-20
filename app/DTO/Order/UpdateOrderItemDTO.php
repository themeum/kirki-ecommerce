<?php

namespace Kirki\Ecommerce\App\DTO\Order;

use Kirki\Ecommerce\DTO;

class UpdateOrderItemDTO extends DTO
{
    /** @var int */
    public $id;

    /** @var int */
    public $order_id;

    /** @var int */
    public $product_id;

    /** @var int */
    public $variant_id;

    /** @var string */
    public $product_name;

    /** @var string|null */
    public $variant_name;

    /** @var string|null */
    public $sku;

    /** @var string|null */
    public $barcode;

    /** @var mixed */
    public $product_image;

    /** @var float */
    public $price;

    /** @var float */
    public $price_base;

    /** @var int */
    public $quantity;

    /** @var float */
    public $subtotal;

    /** @var float */
    public $subtotal_base;

    /** @var float */
    public $discount_amount;

    /** @var float */
    public $discount_amount_base;

    /** @var float */
    public $tax_total;

    /** @var float */
    public $tax_total_base;

    /** @var float */
    public $tax_rate;

    /** @var array */
    public $tax_breakdown = [];

    /** @var float */
    public $total;

    /** @var float */
    public $total_base;

    /** @var bool */
    public $is_physical_product;

    /** @var float */
    public $weight;

    /** @var string */
    public $weight_unit;

    /** @var string JSON encoded string */
    public $product_data;
}
