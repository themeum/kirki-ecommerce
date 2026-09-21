<?php

namespace Kirki\Ecommerce\App\Currency\Providers;

use Kirki\Ecommerce\App\Currency\Contracts\CurrencyProvider;
use Kirki\Ecommerce\App\Currency\DTO\APIUsageDTO;
use Kirki\Ecommerce\App\Currency\DTO\ExchangeRateDTO;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Supports\Facades\Date;
use Kirki\Ecommerce\Framework\Supports\Facades\Http;
use Exception;
use function Kirki\Ecommerce\Framework\resource_url;
use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Exchange rate provider backed by the currencyapi.com v3 API.
 *
 * @since 1.0.0
 */
class CurrencyApiProvider implements CurrencyProvider
{
    const API_URL = 'https://api.currencyapi.com/v3';

    /**
     * @var array<string, mixed>
     */
    protected array $config = [];

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function set_config(array $config)
    {
        $this->config = $config;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_id()
    {
        return 'currency_api';
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_name()
    {
        return __('CurrencyApi', 'kirki-ecommerce');
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_icon()
    {
        return resource_url('images/currency-exchange-providers/currencyapi.png');
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_description()
    {
        return __('CurrencyApi.com - Free & reliable currency data API', 'kirki-ecommerce');
    }

    /**
     * Get the latest exchange rates from the CurrencyApi `/latest` endpoint.
     *
     * Throws through `throw_if()` when the API key is missing or invalid, the
     * request fails, or the response carries no rate data.
     *
     * @since 1.0.0
     *
     * @param string   $base_currency Currency code the rates are relative to.
     * @param string[] $symbols       Currency codes to fetch rates for.
     * @return ExchangeRateDTO
     * @throws Exception When the API key is missing or invalid, the request fails, or the response has no rate data.
     */
    public function get_rates(string $base_currency, array $symbols)
    {
        $api_key = $this->config['api_key'] ?? '';

        throw_if(empty($api_key), __('CurrencyApi API key is missing.', 'kirki-ecommerce'));

        $response = Http::with_headers(['apikey' => $api_key])->get(static::API_URL . '/latest', [
            'base_currency' => $base_currency,
            'currencies' => strtoupper(implode(',', $symbols)),
        ]);

        throw_if($response->status() === Response::UNAUTHORIZED, __('Invalid API key.', 'kirki-ecommerce'));

        throw_if(!$response->successful(), $response->reason() ?: __('Failed to retrieve exchange rates.', 'kirki-ecommerce'));

        $data = $response->json();

        throw_if(empty($data['data']), $data['message'] ?? __('Unknown error from CurrencyApi.', 'kirki-ecommerce'));

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
     * Throws through `throw_if()` when the API key is missing or the request fails.
     *
     * @since 1.0.0
     *
     * @return APIUsageDTO
     * @throws Exception When the API key is missing or the request fails.
     */
    public function get_usage(): APIUsageDTO
    {
        $api_key = $this->config['api_key'] ?? '';

        throw_if(empty($api_key), __('CurrencyApi API key is missing.', 'kirki-ecommerce'));

        $response = Http::get(static::API_URL . '/status', ['apikey' => $api_key]);

        throw_if(!$response->successful(), $response->reason() ?: __('Failed to retrieve CurrencyApi usage data.', 'kirki-ecommerce'));

        $data = $response->json();

        $month = $data['quotas']['month'] ?? [];

        return APIUsageDTO::from_array([
            'total' => $month['total'] ?? null,
            'used' => $month['used'] ?? null,
            'remaining' => $month['remaining'] ?? null,
            'reset_at' => null,
        ]);
    }
}
