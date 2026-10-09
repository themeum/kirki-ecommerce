<?php

namespace Kirki\Ecommerce\App\Constants;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Comparison operators supported by decision conditions.
 *
 * @since 1.0.0
 */
class ComparisonOperator
{
    use HasConstants;
    const EQUAL = '=';
    const NOT_EQUAL = '!=';
    const GREATER_THAN = '>';
    const LESS_THAN = '<';
    const GREATER_THAN_OR_EQUAL = '>=';
    const LESS_THAN_OR_EQUAL = '<=';
    const IN = 'in';
    const NOT_IN = '!in';
}
