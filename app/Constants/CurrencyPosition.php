<?php

namespace Kirki\Ecommerce\App\Constants;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Position of the currency symbol relative to the amount.
 *
 * @since 1.0.0
 */
class CurrencyPosition
{
    use HasConstants;
    const BEFORE = 'before';
    const AFTER = 'after';
}
