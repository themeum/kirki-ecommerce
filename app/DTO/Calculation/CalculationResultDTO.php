<?php

namespace Kirki\Ecommerce\App\DTO\Calculation;

use Kirki\Ecommerce\Framework\DTO;

class CalculationResultDTO extends DTO
{
    /** @var array<int, CalculationItemDTO> Keyed by item ID */
    public $items = [];

    /** @var int */
    public $base_subtotal = 0;
    /** @var int */
    public $base_product_total = 0;
    /** @var int */
    public $base_discount_total = 0;
    /** @var array|null */
    public $discount_details;
    /** @var int */
    public $base_shipping_subtotal = 0;
    /** @var int */
    public $base_shipping_discount = 0;
    /** @var int */
    public $base_shipping_tax = 0;
    /** @var int */
    public $base_shipping_total = 0;
    /** @var int */
    public $base_tax_total = 0;
    /** @var int */
    public $base_total = 0;
    /** @var int */
    public $items_count = 0;
}
