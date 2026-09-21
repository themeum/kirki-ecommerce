<?php

namespace Kirki\Ecommerce\App\Currency\Contracts;

use Kirki\Ecommerce\App\Currency\DTO\APIUsageDTO;
use Kirki\Ecommerce\App\Currency\DTO\ExchangeRateDTO;

/**
 * Contract for an exchange rate provider that supplies currency rates.
 *
 * @since 1.0.0
 */
interface CurrencyProvider
{
    /**
     * Get the display name of the provider.
     *
     * @since 1.0.0
     *
     * @return string
     */
    public function get_name();

    /**
     * Get the unique identifier of the provider.
     *
     * @since 1.0.0
     *
     * @return string
     */
    public function get_id();

    /**
     * Get the URL of the provider's icon image.
     *
     * @since 1.0.0
     *
     * @return string
     */
    public function get_icon();

    /**
     * Get the short description of the provider.
     *
     * @since 1.0.0
     *
     * @return string
     */
    public function get_description();

    /**
     * Set the configuration for the provider.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $config Provider settings, such as the API key.
     * @return void
     */
    public function set_config(array $config);

    /**
     * Get the exchange rates for the given base currency and symbols.
     *
     * @since 1.0.0
     *
     * @param string   $base_currency Currency code the rates are relative to.
     * @param string[] $symbols       Currency codes to fetch rates for.
     * @return ExchangeRateDTO
     */
    public function get_rates(string $base_currency, array $symbols);

    /**
     * Get the API usage data for the current billing period.
     *
     * @since 1.0.0
     *
     * @return APIUsageDTO
     */
    public function get_usage(): APIUsageDTO;
}
