<?php

namespace Kirki\Ecommerce\App\Settings;

use function Kirki\Ecommerce\Framework\deep_set;
use function Kirki\Ecommerce\Framework\value;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\AppSettings;
use Exception;

use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Resolves and caches the settings group instances by option key.
 *
 * @since 1.0.0
 */
class SettingsFactory
{
    /** @var array<string, AppSettings> Settings instances keyed by option key. */
    protected static $cache = [];

    /**
     * Get a settings group by key, or a single value when the key contains a dot path.
     *
     * @since 1.0.0
     *
     * @param string $key     Settings group key, optionally followed by a dot path such as `general.store_name`.
     * @param mixed  $default Value (or callable resolved with value()) returned when a dot path is unknown or null.
     * @return AppSettings|mixed|null Settings instance (null for an unknown group), or the value at the dot path.
     * @throws Exception When the key has no path after the dot.
     */
    public function get(string $key, $default = null)
    {
        if (strpos($key, '.')) {
            $key_parts = explode('.', $key, 2);
            $setting_instance = $this->get_settings_instance($key_parts[0]);

            throw_if(empty($key_parts[1]), __('Invalid settings key!', 'kirki-ecommerce'));

            if (empty($setting_instance)) {
                return value($default);
            }

            return $setting_instance->get($key_parts[1]) ?? value($default);
        }

        return $this->get_settings_instance($key);
    }

    /**
     * Update a whole settings group, or a single value addressed by a dot path.
     *
     * @since 1.0.0
     *
     * @param string $key   Settings group key, optionally followed by a dot path such as `general.store_name`.
     * @param mixed  $value Array of settings for a group key, or the value to set at the dot path.
     * @return void
     * @throws Exception When the key has no path after the dot or the settings group is unknown.
     */
    public function update(string $key, $value)
    {
        if (strpos($key, '.')) {
            $key_parts = explode('.', $key, 2);
            $setting_instance = $this->get_settings_instance($key_parts[0]);

            throw_if(empty($key_parts[1]), __('Invalid settings key!', 'kirki-ecommerce'));

            throw_if(empty($setting_instance), __('Invalid settings key!', 'kirki-ecommerce'));

            $settings_array = $setting_instance->to_array();

            deep_set($settings_array, $key_parts[1], $value);

            return $setting_instance->set($settings_array);
        }

        return $this->get_settings_instance($key)->set($value);
    }

    /**
     * Get the cached settings instance for the given option key.
     *
     * @since 1.0.0
     *
     * @param string $key Option key of the settings group.
     * @return AppSettings|null Null when the key does not match a known settings group.
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
            case OptionKeys::LEGAL_SETTINGS:
                static::$cache[$key] = app()->make(LegalSettings::class);
                break;
            default:
                return null;
        }

        return static::$cache[$key];
    }
}
