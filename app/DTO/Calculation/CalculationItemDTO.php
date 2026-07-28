<?php

namespace Kirki\Ecommerce\App\DTO\Calculation;

use Kirki\Ecommerce\Framework\DTO;

class CalculationItemDTO extends DTO
{
    /** @var int */
    public $id;
    /** @var int */
    public $variant_id;
    /** @var int */
    public $product_id;
    /** @var int */
    public $quantity;
    /** @var int */
    public $unit_price;
    /** @var int */
    public $weight;
    /** @var int */
    public $shipping_profile_id;
    /** @var int|null */
    public $tax_profile_id;
    /** @var array */
    public $product_categories = [];
    /** @var array */
    public $meta = [];
    /** @var int */
    public $subtotal = 0;
    /** @var int */
    public $tax_rate = 0;
    /** @var int */
    public $tax_amount = 0;
    /** @var array */
    public $tax_breakdown = [];
    /** @var int */
    public $discount_amount = 0;
    /** @var int */
    public $total = 0;
}
