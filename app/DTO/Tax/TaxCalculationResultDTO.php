<?php

namespace Kirki\Ecommerce\App\DTO\Tax;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Result of tax calculation: tax lines per item and for shipping.
 *
 * @since 1.0.0
 */
class TaxCalculationResultDTO extends DTO
{
    /** @var array<int|string, TaxLineDTO[]> */
    public $items = [];

    /** @var TaxLineDTO[] */
    public $shipping = [];

    /** @var string|null Address the tax was calculated from (see OrderTaxDestination); null when no tax was calculated */
    public $tax_destination;
}
