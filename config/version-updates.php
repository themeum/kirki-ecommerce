<?php

use Kirki\Ecommerce\App\Supports\Utils;
use Kirki\Ecommerce\Database\Seeders\OnBoarding\OnBoardingSeeder;

use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\migrator;

return [
    '1.0.0-alpha.1' => function () {
        migrator()->run();
        Utils::generate_site_pages();

        // run() only queues the child seeders; invoking the seeder drains the queue.
        $seeder = app()->make(OnBoardingSeeder::class);
        $seeder->run();
        $seeder();
    }
];
