<?php

namespace Kirki\Ecommerce\App\Constants;

use Kirki\Ecommerce\Concerns\HasConstants;

class SellingLocationType
{
    use HasConstants;

    const ALL_COUNTRIES = 'all-countries';
    const SELECTED_COUNTRIES = 'selected-countries';
    const EXCLUDED_COUNTRIES = 'excluded-countries';
}
