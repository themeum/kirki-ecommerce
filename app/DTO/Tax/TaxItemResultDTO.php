<?php

namespace Kirki\Ecommerce\App\DTO\Tax;

use Kirki\Ecommerce\DTO;

class TaxItemResultDTO extends DTO
{
    /**
     * @var string
     */
    public $name;

    /**
     * @var float
     */
    public $rate;

    /**
     * @var int
     */
    public $amount;
}
