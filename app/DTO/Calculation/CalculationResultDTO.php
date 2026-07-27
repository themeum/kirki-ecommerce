<?php

namespace Kirki\Ecommerce\App\DTO\Calculation;

use Kirki\Ecommerce\Framework\DTO;

class CalculationResultDTO extends DTO
{
    /** @var array<int, CalculationItemDTO> Keyed by item ID */
    public $items = [];

    /** @var int */
    public $subtotal = 0;
    /** @var int */
    public $discount_total = 0;
    /** @var array|null */
    public $discount_details;
    /** @var int */
    public $shipping_subtotal = 0;
    /** @var int */
    public $shipping_discount = 0;
    /** @var int */
    public $shipping_tax = 0;
    /** @var int */
    public $shipping_total = 0;
    /** @var int */
    public $tax_total = 0;
    /** @var int */
    public $total = 0;
    /** @var int */
    public $items_count = 0;
}
