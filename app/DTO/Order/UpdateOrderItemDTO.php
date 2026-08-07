<?php

namespace Kirki\Ecommerce\App\DTO\Order;

use Kirki\Ecommerce\Framework\DTO;

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
    public $invoiced_price;

    /** @var float */
    public $base_price;

    /** @var int */
    public $quantity;

    /** @var float */
    public $invoiced_subtotal;

    /** @var float */
    public $base_subtotal;

    /** @var float */
    public $invoiced_discount_amount;

    /** @var float */
    public $base_discount_amount;

    /** @var float */
    public $invoiced_tax_total;

    /** @var float */
    public $base_tax_total;

    /** @var float */
    public $tax_rate;

    /** @var array */
    public $tax_breakdown = [];

    /** @var float */
    public $invoiced_total;

    /** @var float */
    public $base_total;

    /** @var bool */
    public $is_physical_product;

    /** @var float */
    public $weight;

    /** @var string */
    public $weight_unit;

    /** @var string JSON encoded string */
    public $product_data;
}
