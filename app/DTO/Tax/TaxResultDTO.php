<?php

namespace Kirki\Ecommerce\App\DTO\Tax;

use Kirki\Ecommerce\Framework\DTO;

class TaxResultDTO extends DTO
{
    /**
     * @var TaxItemResultDTO[]
     */
    public $breakdown = [];

    /**
     * @var int
     */
    public $base_total = 0;
}
