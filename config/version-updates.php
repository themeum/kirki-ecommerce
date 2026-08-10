<?php

use Kirki\Ecommerce\App\Supports\Utils;

use function Kirki\Ecommerce\Framework\migrator;

return [
    '1.0.0-alpha.1' => function () {
        migrator()->run();
        Utils::generate_site_pages();
    }
];
