<?php

namespace Kirki\Ecommerce\App\Settings;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\AppSettings;

class PaymentSettings extends AppSettings
{
    public function get_option_key()
    {
        return OptionKeys::PAYMENT_SETTINGS;
    }
}
