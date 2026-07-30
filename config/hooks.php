<?php

use Kirki\Ecommerce\App\Hooks\Actions\AddWpHeadMeta;
use Kirki\Ecommerce\App\Hooks\Actions\EnqueueSiteScripts;
use Kirki\Ecommerce\App\Hooks\Filters\PageIdentifier;
use Kirki\Ecommerce\App\Hooks\Filters\ReplaceSiteTitle;
use Kirki\Ecommerce\App\Wordpress\Hooks\Actions\EnqueueAdminScripts;
use Kirki\Ecommerce\App\Wordpress\Hooks\Actions\RemoveDuplicateSubmenu;
use Kirki\Ecommerce\App\Wordpress\Hooks\Actions\SMTPConfig;
use Kirki\Ecommerce\Framework\Wordpress\Hooks\Actions\RegisterAdminMenu;
use Kirki\Ecommerce\Framework\Wordpress\Hooks\Actions\RegisterRestApi;

return [
    'actions' => [
        RegisterAdminMenu::class,
        EnqueueAdminScripts::class,
        EnqueueSiteScripts::class,
        RemoveDuplicateSubmenu::class,
        RegisterRestApi::class,
        AddWpHeadMeta::class,
        SMTPConfig::class,
    ],
    'filters' => [
        ReplaceSiteTitle::class,
        PageIdentifier::class,
    ],
];
