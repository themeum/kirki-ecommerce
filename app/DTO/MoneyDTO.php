<?php

namespace Kirki\Ecommerce\App\DTO;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Data object for a monetary amount: raw value, formatted display string and currency.
 *
 * @since 1.0.0
 */
class MoneyDTO extends DTO
{
    /** @var float */
    public $raw;
    
    /** @var string */
    public $display;

    /** @var CurrencyDTO */
    public $currency;
}
