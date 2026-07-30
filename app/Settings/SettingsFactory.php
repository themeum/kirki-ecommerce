<?php

namespace Kirki\Ecommerce\App\Settings;

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
     * @return mixed
     */
    public function get(string $key)
    {
        if(strpos($key, '.')) {
            $key_parts = explode('.', $key);
            $settings_key = array_shift($key_parts);
            $setting_instance = $this->get_settings_instance($settings_key);

            $inner_key = implode('.', $key_parts);

            if (empty($inner_key)) {
                throw new Exception(__('Invalid settings key!', 'kirki-ecommerce'));
            }

            return $setting_instance->get($inner_key);
        }

        return $this->get_settings_instance($key);
    }

    /**
     * Get the settings instance for the given key.
     *
     * @param string $key
     * @return AppSettings
     * @throws Exception
     */
    public function get_settings_instance(string $key): AppSettings
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
            default:
                throw new Exception(
                    /* translators: %s: key */
                    sprintf(__('Invalid settings key: %s', 'kirki-ecommerce'), $key)
                );
        }

        return static::$cache[$key];
    }
}
