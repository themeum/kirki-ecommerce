<?php

namespace Kirki\Ecommerce\App\Currency\Contracts;

use Kirki\Ecommerce\App\Currency\DTO\APIUsageDTO;
use Kirki\Ecommerce\App\Currency\DTO\ExchangeRateDTO;

interface CurrencyProvider
{
    /**
     * Get the name of the provider.
     *
     * @return string
     */
    public function get_name();

    /**
     * Get the ID of the provider.
     *
     * @return string
     */
    public function get_id();

    /**
     * Get the icon of the provider.
     *
     * @return string
     */
    public function get_icon();

    /**
     * Get the description of the provider.
     *
     * @return string
     */
    public function get_description();

    /**
     * Set the configuration for the provider.
     *
     * @param array $config
     */
    public function set_config(array $config);

    /**
     * Get the exchange rates for the given base currency and symbols.
     *
     * @param string $base_currency
     * @param array $symbols
     * @return ExchangeRateDTO
     */
    public function get_rates(string $base_currency, array $symbols);

    /**
     * Get the API usage data for the current billing period.
     *
     * @return APIUsageDTO
     */
    public function get_usage(): APIUsageDTO;
}
