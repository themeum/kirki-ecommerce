<?php

namespace Kirki\Ecommerce\App\Currency\Providers;

use Kirki\Ecommerce\App\Currency\Contracts\CurrencyProvider;
use Kirki\Ecommerce\App\Currency\DTO\APIUsageDTO;
use Kirki\Ecommerce\App\Currency\DTO\ExchangeRateDTO;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Supports\Facades\Http;
use Exception;
use function Kirki\Ecommerce\Framework\resource_url;
use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Exchange rate provider backed by the exchangerate-api.com v6 API.
 *
 * @since 1.0.0
 */
class ExchangeRatesApiProvider implements CurrencyProvider
{
    const API_URL = 'https://v6.exchangerate-api.com/v6';

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
        return 'exchange_rates_api';
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_name()
    {
        return __('Exchange Rates API', 'kirki-ecommerce');
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_icon()
    {
        return resource_url('images/currency-exchange-providers/exchangeratesapi.png');
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_description()
    {
        return __('Exchange Rates API', 'kirki-ecommerce');
    }

    /**
     * Get the latest exchange rates for the base currency from the exchangerate-api.com endpoint.
     *
     * Returns every rate the API provides, since the API has no symbol filter.
     * Throws through `throw_if()` when the API key is missing or invalid, the
     * request fails, or the API reports a non-success result.
     *
     * @since 1.0.0
     *
     * @param string   $base_currency Currency code the rates are relative to.
     * @param string[] $symbols       Currency codes requested; unused by this provider.
     * @return ExchangeRateDTO
     * @throws Exception When the API key is missing or invalid, the request fails, or the API reports a non-success result.
     */
    public function get_rates(string $base_currency, array $symbols)
    {
        $api_key = $this->config['api_key'] ?? '';

        throw_if(empty($api_key), __('Exchange Rates API access key is missing.', 'kirki-ecommerce'));
        $response = Http::get(static::API_URL . '/' . $api_key . '/latest/' . $base_currency);

        throw_if($response->status() === Response::UNAUTHORIZED, __('Invalid API key.', 'kirki-ecommerce'));

        throw_if(!$response->successful(), $response->reason() ?: __('Failed to retrieve exchange rates.', 'kirki-ecommerce'));

        $data = $response->json();

        throw_if($data['result'] !== 'success', __('Unknown error from Exchange Rates API.', 'kirki-ecommerce'));

        return ExchangeRateDTO::from_array([
            'provider_id' => $this->get_id(),
            'base_currency' => $data['base_code'],
            'rates' => $data['conversion_rates'],
            'timestamp' => $data['time_next_update_unix']
        ]);
    }

    /**
     * Get the API usage data for the current billing period.
     *
     * This provider does not expose usage, so every field of the returned DTO is null.
     *
     * @since 1.0.0
     *
     * @return APIUsageDTO
     */
    public function get_usage(): APIUsageDTO
    {
        return APIUsageDTO::from_array([
            'total' => null,
            'used' => null,
            'remaining' => null,
            'reset_at' => null,
        ]);
    }
}
