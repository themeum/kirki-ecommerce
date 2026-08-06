<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

class MollieConstant
{
    const API_KEY_PATTERN = '/^(live|test)_\w{30,}$/';
    const API_BASE_URL = 'https://api.mollie.com/v2/';
}
