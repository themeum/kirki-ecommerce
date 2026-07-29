<?php

namespace Kirki\Ecommerce\App\Settings;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\AppSettings;

class GeneralSettings extends AppSettings
{
    public function get_option_key()
    {
        return OptionKeys::GENERAL_SETTINGS;
    }
}
