<?php

namespace Kirki\Ecommerce\App\Settings;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\AppSettings;
use Exception;

use function Kirki\Ecommerce\app;

class SettingsFactory
{
    /**
     * Cache the setting classes
     *
     * @var array
     */
    protected static $cache = [];

    /**
     * Get the settings instance for the given key.
     *
     * @param string $key
     * @return AppSettings
     * @throws Exception
     */
    public function get(string $key): AppSettings
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
                throw new Exception("Invalid settings key: {$key}");
        }

        return static::$cache[$key];
    }
}
