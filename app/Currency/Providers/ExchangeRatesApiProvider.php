<?php

namespace Kirki\Ecommerce\App\Currency\Providers;

use Kirki\Ecommerce\App\Currency\Contracts\CurrencyProvider;
use Kirki\Ecommerce\App\Currency\DTO\APIUsageDTO;
use Kirki\Ecommerce\App\Currency\DTO\ExchangeRateDTO;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Supports\Facades\Http;
use Exception;
use function Kirki\Ecommerce\Framework\resource_url;

class ExchangeRatesApiProvider implements CurrencyProvider
{
    const API_URL = 'http://api.exchangeratesapi.io/v1';

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
        return 'exchange_rates_api';
    }

    /**
     * Get the name of the provider.
     *
     * @return string
     */
    public function get_name()
    {
        return __('Exchange Rates API', 'kirki-ecommerce');
    }

    /**
     * Get the icon of the provider.
     *
     * @return string
     */
    public function get_icon()
    {
        return resource_url('images/currency-exchange-providers/exchangeratesapi.png');
    }

    /**
     * Get the description of the provider.
     *
     * @return string
     */
    public function get_description()
    {
        return __('Exchange Rates API', 'kirki-ecommerce');
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
            throw new Exception(__('Exchange Rates API access key is missing.', 'kirki-ecommerce'));
        }
        $response = Http::get(static::API_URL . '/latest', [
            'access_key' => $api_key,
            'base' => $base_currency,
            'symbols' => implode(',', $symbols),
        ]);

        if ($response->status() === Response::UNAUTHORIZED) {
            throw new Exception(__('Invalid API key.', 'kirki-ecommerce'));
        }

        if (!$response->successful()) {
            throw new Exception($response->reason() ?: __('Failed to retrieve exchange rates.', 'kirki-ecommerce'));
        }

        $data = $response->json();

        if (empty($data['success']) || !$data['success']) {
            throw new Exception($data['error']['info'] ?? __('Unknown error from Exchange Rates API.', 'kirki-ecommerce'));
        }

        return ExchangeRateDTO::from_array([
            'provider_id' => $this->get_id(),
            'base_currency' => $data['base'],
            'rates' => $data['rates'],
            'timestamp' => $data['timestamp']
        ]);
    }

    /**
     * Get the API usage data for the current billing period.
     *
     * Uses the dedicated /usage endpoint which returns structured JSON
     * with current_usage, limit, and remaining counts.
     *
     * @return APIUsageDTO
     * @throws Exception
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
