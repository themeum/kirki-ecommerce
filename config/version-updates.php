<?php

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\Utils;
use Kirki\Ecommerce\Database\Seeders\OnBoarding\OnBoardingSeeder;

use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\migrator;

return [
    'before_each' => function () {
        migrator()->run();
    },
    '1.0.0-alpha.1' => function () {
        Utils::generate_site_pages();

        // run() only queues the child seeders; invoking the seeder drains the queue.
        $seeder = app()->make(OnBoardingSeeder::class);
        $seeder->run();
        $seeder();
    },
    '1.0.0-alpha.2' => function () {
        Utils::generate_site_pages();
    },
    '1.0.0-alpha.3' => function () {
        // Nothing to do here
        // We need to keep it for running the migrator
    }
];
