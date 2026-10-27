<?php

namespace Kirki\Ecommerce\App\DTO;

defined('ABSPATH') || exit;

/**
 * Data object for a monetary amount with a short display string, such as `$20.3K`.
 *
 * @since 1.0.0
 */
class ShortMoneyDTO extends MoneyDTO
{
    /** @var string */
    public $short_display;
}
