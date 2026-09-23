<?php

namespace Kirki\Ecommerce\App;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\AppSettings;
use Kirki\Ecommerce\App\Decisions\DecisionEngine;
use Kirki\Ecommerce\App\Models\Currency;
use Kirki\Ecommerce\App\Services\CurrencyService;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\App\Wordpress\Customer;
use Kirki\Ecommerce\Framework\Supports\Facades\Date;

use function Kirki\Ecommerce\Framework\app;

if (!function_exists('Kirki\Ecommerce\App\customer')) {
    /**
     * Get a customer instance for the given user and customer IDs.
     *
     * @since 1.0.0
     *
     * @param int|null $user_id     WordPress user ID.
     * @param int|null $customer_id Customer record ID.
     * @return Customer
     */
    function customer($user_id = null, $customer_id = null)
    {
        return app()->make(Customer::class, ['user_id' => $user_id, 'customer_id' => $customer_id]);
    }
}

if (!function_exists('Kirki\Ecommerce\App\settings')) {
    /**
     * Get a settings group by key, or a single value when the key contains a dot path.
     *
     * @since 1.0.0
     *
     * @param string $key Settings group key, optionally followed by a dot path such as `general.store_name`.
     * @return AppSettings|mixed Settings instance (null for an unknown group), or the stored value for a dot path.
     */
    function settings($key)
    {
        return Settings::get($key);
    }
}

if (!function_exists('Kirki\Ecommerce\App\decision_engine')) {
    /**
     * Get the decision engine instance from the container.
     *
     * @since 1.0.0
     *
     * @return DecisionEngine
     */
    function decision_engine()
    {
        return app()->make(DecisionEngine::class);
    }
}

if (!function_exists('Kirki\Ecommerce\App\base_currency')) {
    /**
     * Get the store's base currency.
     *
     * @since 1.0.0
     *
     * @return Currency|null
     */
    function base_currency()
    {
        return app()->make(CurrencyService::class)->get_base_currency();
    }
}

if (!function_exists('Kirki\Ecommerce\resource_path')) {
    /**
     * Get the absolute path to the plugin's resources directory, optionally with a sub-path appended.
     *
     * @since 1.0.0
     *
     * @param string $path Sub-path to append.
     * @return string
     */
    function resource_path($path = '')
    {
        return app()->resource_path($path);
    }
}

if (!function_exists('Kirki\Ecommerce\json_decoded_data')) {
    /**
     * Read a JSON file and decode its contents.
     *
     * @since 1.0.0
     *
     * @param string $file_path   Absolute path of the JSON file.
     * @param bool   $associative Whether to decode objects as associative arrays.
     * @return mixed Decoded data, or null when the file does not exist or holds invalid JSON.
     */
    function json_decoded_data(string $file_path, bool $associative = true)
    {
        if (!file_exists($file_path)) {
            return null;
        }

        $content = file_get_contents($file_path);

        return json_decode($content, $associative);
    }
}

if (!function_exists('Kirki\Ecommerce\App\to_utc_date_string')) {
    /**
     * Convert a datetime value to a UTC date string.
     *
     * @since 1.0.0
     *
     * @param string|null $value Date or datetime string in any format the Date facade parses.
     * @return string|null Null when the value is empty.
     */
    function to_utc_date_string($value)
    {
        if (empty($value)) {
            return null;
        }

        return Date::parse($value)->set_timezone('UTC')->to_date_string();
    }
}

if (!function_exists('Kirki\Ecommerce\App\to_utc_datetime_string')) {
    /**
     * Convert a datetime value to a UTC datetime string.
     *
     * @since 1.0.0
     *
     * @param string|null $value Date or datetime string in any format the Date facade parses.
     * @return string|null Null when the value is empty.
     */
    function to_utc_datetime_string($value)
    {
        if (empty($value)) {
            return null;
        }

        return Date::parse($value)->set_timezone('UTC')->to_date_time_string();
    }
}
