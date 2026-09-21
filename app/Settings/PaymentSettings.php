<?php

namespace Kirki\Ecommerce\App\Settings;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\AppSettings;

/**
 * Settings group for the store's payment options.
 *
 * @since 1.0.0
 */
class PaymentSettings extends AppSettings
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_option_key()
    {
        return OptionKeys::PAYMENT_SETTINGS;
    }
}
