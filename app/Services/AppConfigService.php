<?php

namespace Kirki\Ecommerce\App\Services;

use function Kirki\Ecommerce\App\base_currency;
use function Kirki\Ecommerce\Framework\user;

class AppConfigService
{
    public function get_app_config()
    {
        return [
            'name' => __('Kirki eCommerce', 'kirki-ecommerce'),
            'version' => KIRKI_ECOMMERCE_VERSION,
            'current_user' => user()->get_data(),
            'base_currency' => base_currency(),

        ];
    }
}
