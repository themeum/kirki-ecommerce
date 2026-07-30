<?php

namespace Kirki\Ecommerce\App\Settings;

use function Kirki\Ecommerce\Framework\value;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\AppSettings;
use Exception;

use function Kirki\Ecommerce\Framework\app;

class SettingsFactory
{
    /**
     * Cache the setting classes
     *
     * @var array
     */
    protected static $cache = [];

    /**
     * Get all settings instances
     *
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public function get(string $key, $default = null)
    {
        if (strpos($key, '.')) {
            $key_parts = explode('.', $key, 2);
            $setting_instance = $this->get_settings_instance($key_parts[0]);

            if (empty($key_parts[1])) {
                throw new Exception(__('Invalid settings key!', 'kirki-ecommerce'));
            }

            if (empty($setting_instance)) {
                return value($default);
            }

            return $setting_instance->get($key_parts[1]) ?? value($default);
        }

        return $this->get_settings_instance($key);
    }

    /**
     * Get the settings instance for the given key.
     *
     * @param string $key
     * @return AppSettings|null
     * @throws Exception
     */
    public function get_settings_instance(string $key)
    {
        if (isset(static::$cache[$key])) {
            return static::$cache[$key];
        }

        switch ($key) {
            case OptionKeys::GENERAL_SETTINGS:
                static::$cache[$key] = app()->make(GeneralSettings::class);
                break;
            case OptionKeys::PRODUCT_SETTINGS:
                static::$cache[$key] = app()->make(ProductSettings::class);
                break;
            case OptionKeys::SHIPPING_SETTINGS:
                static::$cache[$key] = app()->make(ShippingSettings::class);
                break;
            case OptionKeys::PAYMENT_SETTINGS:
                static::$cache[$key] = app()->make(PaymentSettings::class);
                break;
            case OptionKeys::TAX_SETTINGS:
                static::$cache[$key] = app()->make(TaxSettings::class);
                break;
            case OptionKeys::CHECKOUT_SETTINGS:
                static::$cache[$key] = app()->make(CheckoutSettings::class);
                break;
            case OptionKeys::CURRENCY_SETTINGS:
                static::$cache[$key] = app()->make(CurrencySettings::class);
                break;
            case OptionKeys::EMAIL_SETTINGS:
                static::$cache[$key] = app()->make(EmailSettings::class);
                break;
            case OptionKeys::ADVANCE_SETTINGS:
                static::$cache[$key] = app()->make(AdvanceSettings::class);
                break;
            default:
                return null;
        }

        return static::$cache[$key];
    }
}
