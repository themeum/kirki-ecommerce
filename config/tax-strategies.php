<?php

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Tax\Strategies\DefaultTaxStrategy;
use Kirki\Ecommerce\App\Tax\Strategies\EUTaxStrategy;

return [
    'EU' => EUTaxStrategy::class,
    'DEFAULT' => DefaultTaxStrategy::class
];