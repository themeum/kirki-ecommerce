<?php

namespace Kirki\Ecommerce\App\DTO;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Data object for a currency's code and symbol, embedded in MoneyDTO.
 *
 * @since 1.0.0
 */
class CurrencyDTO extends DTO
{
    /** @var string */
    public $code;
    
    /** @var string */
    public $symbol;
}
