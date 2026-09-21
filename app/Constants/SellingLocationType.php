<?php

namespace Kirki\Ecommerce\App\Constants;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Modes for limiting which countries the store sells to.
 *
 * @since 1.0.0
 */
class SellingLocationType
{
    use HasConstants;

    const ALL_COUNTRIES = 'all-countries';
    const SELECTED_COUNTRIES = 'selected-countries';
    const EXCLUDED_COUNTRIES = 'excluded-countries';
}
