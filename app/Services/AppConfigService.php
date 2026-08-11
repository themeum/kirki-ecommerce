<?php

namespace Kirki\Ecommerce\App\Services;

use function Kirki\Ecommerce\App\base_currency;
use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\user;

class AppConfigService
{
    public function get_app_config()
    {
        return [
            'name' => __('Kirki eCommerce', 'kirki-ecommerce'),
            'version' => app()->version(),
            'current_user' => user()->get_data(),
            'base_currency' => base_currency(),
        ];
    }
}
