<?php

namespace Kirki\Ecommerce\App;

use Kirki\Ecommerce\App\AppSettings;
use Kirki\Ecommerce\App\Decisions\DecisionEngine;
use Kirki\Ecommerce\App\Models\Currency;
use Kirki\Ecommerce\App\Services\CurrencyService;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\App\Wordpress\Customer;

use function Kirki\Ecommerce\Framework\app;

if (!function_exists('Kirki\Ecommerce\App\customer')) {
    /**
     * Get the customer instance.
     *
     * @param int|null $user_id
     * @param int|null $customer_id
     *
     * @return Customer
     * @since 1.0.0
     */
    function customer($user_id = null, $customer_id = null)
    {
        return app()->make(Customer::class, ['user_id' => $user_id, 'customer_id' => $customer_id]);
    }
}

if (!function_exists('Kirki\Ecommerce\App\settings')) {
    /**
     * Get the settings instance.
     *
     * @param string $key
     *
     * @return AppSettings
     * @since 1.0.0
     */
    function settings($key)
    {
        return Settings::get($key);
    }
}

if (!function_exists('Kirki\Ecommerce\App\decision_engine')) {
    /**
     * Get the decision engine instance.
     *
     * @return DecisionEngine
     * @since 1.0.0
     */
    function decision_engine()
    {
        return app()->make(DecisionEngine::class);
    }
}

if (!function_exists('Kirki\Ecommerce\App\base_currency')) {
    /**
     * Get the base currency object/model.
     *
     * @return Currency|null
     * @since 1.0.0
     */
    function base_currency()
    {
        return app()->make(CurrencyService::class)->get_base_currency();
    }
}

if (!function_exists('Kirki\Ecommerce\resource_path')) {
    /**
     * Get the path to the resources directory.
     *
     * @param string $path
     * @return string
     */
    function resource_path($path = '')
    {
        return app()->resource_path($path);
    }
}

if (!function_exists('Kirki\Ecommerce\json_decoded_data')) {
    /**
     * Get the decoded JSON data from a file.
     * 
     * @param string $file_path
     * @param bool $associative
     * @return mixed
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