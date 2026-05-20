<?php

namespace Kirki\Ecommerce\App\Settings;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\AppSettings;

class EmailSettings extends AppSettings
{
    public function get_option_key()
    {
        return OptionKeys::EMAIL_SETTINGS;
    }
}
