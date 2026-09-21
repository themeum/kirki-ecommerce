<?php

namespace Kirki\Ecommerce\App\DTO\Tax;

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
}
