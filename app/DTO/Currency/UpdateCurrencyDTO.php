<?php

namespace Kirki\Ecommerce\App\DTO\Currency;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Data object for updating a currency.
 *
 * @since 1.0.0
 */
class UpdateCurrencyDTO extends DTO
{
    /** @var int */
    public $id;

    /** @var string|null */
    public $code;

    /** @var string */
    public $name;

    /** @var string|null */
    public $symbol;

    /** @var float|null */
    public $exchange_rate;

    /** @var bool|null */
    public $is_base;

    /** @var bool */
    public $is_active;
}
