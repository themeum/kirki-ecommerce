<?php

namespace Kirki\Ecommerce\App\DTO\Tax;

use Kirki\Ecommerce\Framework\DTO;

class TaxCalculationResultDTO extends DTO
{
    /**
     * @var array<int|string, TaxLineDTO[]>
     */
    public $items = [];

    /**
     * @var TaxLineDTO[]
     */
    public $shipping = [];
}
