<?php

namespace Kirki\Ecommerce\App\Constants;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Thousand separator options for formatting currency values.
 *
 * @since 1.0.0
 */
class ThousandSeparator
{
    use HasConstants;
    const DOT = '.';
    const COMMA = ',';
    const SPACE = 'space';
}
