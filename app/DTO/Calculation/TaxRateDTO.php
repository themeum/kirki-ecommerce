<?php

namespace Kirki\Ecommerce\App\DTO\Calculation;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\DTO;

/**
 * A tax rate stored on an order, which an edit of that order keeps.
 *
 * @since 1.0.0
 */
class TaxRateDTO extends DTO
{
    /** @var string */
    public $name;

    /** @var float Rate in percent */
    public $rate;
}
