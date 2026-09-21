<?php

namespace Kirki\Ecommerce\App\DTO\Tax;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Input to tax calculation: addresses, shipping fee and the taxable items.
 *
 * @since 1.0.0
 */
class TaxCalculationContextDTO extends DTO
{
    /** @var array */
    public $shipping_address = [];

    /** @var array */
    public $billing_address = [];

    /** @var int */
    public $shipping_fee = 0;

    /** @var bool */
    public $is_shipping_taxable = false;

    /** @var TaxableItemDTO[] */
    public $items = [];
}
