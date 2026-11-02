<?php

defined('ABSPATH') || exit;

use function Kirki\Ecommerce\Framework\migrator;

return [
    'before_each' => function () {
        migrator()->run();
    },
    '1.0.0' => function () {
        // Nothing to do here
        // We need to keep it for running the migrator
    }
];
