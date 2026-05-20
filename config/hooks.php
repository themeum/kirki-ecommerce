<?php

use Kirki\Ecommerce\Wordpress\Hooks\Actions\EnqueueAdminScripts;
use Kirki\Ecommerce\Wordpress\Hooks\Actions\RegisterAdminMenu;
use Kirki\Ecommerce\Wordpress\Hooks\Actions\RegisterRestApi;
use Kirki\Ecommerce\Wordpress\Hooks\Actions\RemoveDuplicateSubmenu;
use Kirki\Ecommerce\Wordpress\Hooks\Actions\SMTPConfig;

return [
    'actions' => [
        RegisterAdminMenu::class,
        EnqueueAdminScripts::class,
        RemoveDuplicateSubmenu::class,
        RegisterRestApi::class,
        SMTPConfig::class,
    ],
    'filters' => [],
];
