<?php

namespace Kirki\Ecommerce\App\DTO\Calculation;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Result of a price calculation: per-item amounts and order-level base-currency totals.
 *
 * @since 1.0.0
 */
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
    /** @var \Kirki\Ecommerce\App\DTO\Discount\CouponDiscountResultDTO[] */
    public $coupon_results = [];
    /** @var int */
    public $base_shipping_subtotal = 0;
    /** @var int */
    public $base_shipping_discount = 0;
    /** @var int */
    public $base_shipping_tax = 0;
    /** @var \Kirki\Ecommerce\App\DTO\Tax\TaxLineDTO[] */
    public $shipping_tax_lines = [];
    /** @var int */
    public $base_shipping_total = 0;
    /** @var int */
    public $base_tax_total = 0;
    /** @var int */
    public $base_total = 0;
    /** @var int */
    public $items_count = 0;
}
