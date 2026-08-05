<?php

namespace Kirki\Ecommerce\App\DTO;

use Kirki\Ecommerce\Framework\DTO;

class MoneyDTO extends DTO
{
    /** @var float */
    public $raw;
    
    /** @var string */
    public $display;

    /** @var CurrencyDTO */
    public $currency;
}
