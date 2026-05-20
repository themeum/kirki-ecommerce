<?php

namespace Kirki\Ecommerce\App\DTO\Currency;

use Kirki\Ecommerce\DTO;

class CreateCurrencyDTO extends DTO
{
    /** @var string|null */
    public $code;

    /** @var string */
    public $name;

    /** @var string|null */
    public $symbol;

    /** @var float|null */
    public $exchange_rate;

    /** @var string|null */
    public $is_base;

    /** @var string */
    public $is_active;
}
