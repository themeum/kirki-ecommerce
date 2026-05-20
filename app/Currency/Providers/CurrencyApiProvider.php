<?php

namespace Kirki\Ecommerce\App\Currency\Providers;

use Kirki\Ecommerce\App\Currency\Contracts\CurrencyProvider;
use Kirki\Ecommerce\App\Currency\DTO\APIUsageDTO;
use Kirki\Ecommerce\App\Currency\DTO\ExchangeRateDTO;
use Kirki\Ecommerce\Http\Response;
use Kirki\Ecommerce\Supports\Facades\Date;
use Kirki\Ecommerce\Supports\Facades\Http;
use Exception;
use function Kirki\Ecommerce\resource_url;

class CurrencyApiProvider implements CurrencyProvider
{
    const API_URL = 'https://api.currencyapi.com/v3';

    protected array $config = [];

    /**
     * Set the configuration for the provider.
     *
     * @param array $config
     */
    public function set_config(array $config)
    {
        $this->config = $config;
    }

    /**
     * Get the ID of the provider.
     *
     * @return string
     */
    public function get_id()
    {
        return 'currency_api';
    }

    /**
     * Get the name of the provider.
     *
     * @return string
     */
    public function get_name()
    {
        return __('CurrencyApi', 'kirki-ecommerce');
    }

    /**
     * Get the icon of the provider.
     *
     * @return string
     */
    public function get_icon()
    {
        return resource_url('images/currency-exchange-providers/currencyapi.png');
    }

    /**
     * Get the description of the provider.
     *
     * @return string
     */
    public function get_description()
    {
        return __('CurrencyApi.com - Free & reliable currency data API', 'kirki-ecommerce');
    }

    /**
     * Get the exchange rates for the given base currency and symbols.
     *
     * @param string $base_currency
     * @param array $symbols
     * @return ExchangeRateDTO
     */
    public function get_rates(string $base_currency, array $symbols)
    {
        $api_key = $this->config['api_key'] ?? '';

        if (empty($api_key)) {
            throw new Exception(__('CurrencyApi API key is missing.', 'kirki-ecommerce'));
        }

        $response = Http::with_headers(['apikey' => $api_key])->get(static::API_URL . '/latest', [
            'base_currency' => $base_currency,
            'currencies' => strtoupper(implode(',', $symbols)),
        ]);

        if ($response->status() === Response::UNAUTHORIZED) {
            throw new Exception(__('Invalid API key.', 'kirki-ecommerce'));
        }

        if (!$response->successful()) {
            throw new Exception($response->reason() ?: __('Failed to retrieve exchange rates.', 'kirki-ecommerce'));
        }

        $data = $response->json();

        if (empty($data['data'])) {
            throw new Exception($data['message'] ?? __('Unknown error from CurrencyApi.', 'kirki-ecommerce'));
        }

        $rates = [];

        foreach ($data['data'] as $code => $currency_data) {
            $rates[$code] = $currency_data['value'];
        }

        $timestamp = isset($data['meta']['last_updated_at'])
            ? strtotime($data['meta']['last_updated_at'])
            : time();

        return ExchangeRateDTO::from_array([
            'provider_id' => $this->get_id(),
            'base_currency' => $base_currency,
            'rates' => $rates,
            'timestamp' => $timestamp
        ]);
    }

    /**
     * Get the API usage data for the current billing period.
     *
     * Calls the /v3/status endpoint which does NOT count against the quota.
     *
     * @return APIUsageDTO
     * @throws Exception
     */
    public function get_usage(): APIUsageDTO
    {
        $api_key = $this->config['api_key'] ?? '';

        if (empty($api_key)) {
            throw new Exception(__('CurrencyApi API key is missing.', 'kirki-ecommerce'));
        }

        $response = Http::get(static::API_URL . '/status', ['api_key' => $api_key]);

        if (!$response->successful()) {
            throw new Exception($response->reason() ?: __('Failed to retrieve CurrencyApi usage data.', 'kirki-ecommerce'));
        }

        $data = $response->json();

        $month = $data['quotas']['month'] ?? [];

        return APIUsageDTO::from_array([
            'total' => $month['total'] ?? null,
            'used' => $month['used'] ?? null,
            'remaining' => $month['remaining'] ?? null,
            'reset_at' => Date::now()->addMonth()->firstOfMonth(),
        ]);
    }
}
