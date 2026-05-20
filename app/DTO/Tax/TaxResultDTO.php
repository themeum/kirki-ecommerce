<?php

namespace Kirki\Ecommerce\App\DTO\Tax;

use Kirki\Ecommerce\DTO;

class TaxResultDTO extends DTO
{
    /**
     * @var TaxItemResultDTO[]
     */
    public $breakdown = [];

    /**
     * @var int
     */
    public $total = 0;
}
