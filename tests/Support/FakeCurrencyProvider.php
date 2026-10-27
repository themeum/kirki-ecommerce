<?php

namespace Kirki\Ecommerce\Tests\Support;

use Exception;
use Kirki\Ecommerce\App\Currency\Contracts\CurrencyProvider;
use Kirki\Ecommerce\App\Currency\DTO\APIUsageDTO;
use Kirki\Ecommerce\App\Currency\DTO\ExchangeRateDTO;

/**
 * Exchange rate provider that returns fixed rates, or fails, without any HTTP request.
 */
class FakeCurrencyProvider implements CurrencyProvider
{
    const ID = 'fake-provider';

    /**
     * Rates returned by get_rates(), keyed by currency code.
     *
     * @var array<string, float>
     */
    public static $rates = [];

    /**
     * Error message get_rates() throws, or null to return the rates.
     *
     * @var string|null
     */
    public static $error = null;

    /**
     * Number of get_rates() calls.
     *
     * @var int
     */
    public static $calls = 0;

    /**
     * Reset the shared fake state.
     *
     * @return void
     */
    public static function reset(): void
    {
        static::$rates = [];
        static::$error = null;
        static::$calls = 0;
    }

    /**
     * @inheritDoc
     */
    public function get_name()
    {
        return 'Fake Provider';
    }

    /**
     * @inheritDoc
     */
    public function get_id()
    {
        return static::ID;
    }

    /**
     * @inheritDoc
     */
    public function get_icon()
    {
        return '';
    }

    /**
     * @inheritDoc
     */
    public function get_description()
    {
        return '';
    }

    /**
     * @inheritDoc
     */
    public function set_config(array $config)
    {
    }

    /**
     * @inheritDoc
     */
    public function get_rates(string $base_currency, array $symbols)
    {
        static::$calls++;

        if (static::$error !== null) {
            throw new Exception(static::$error);
        }

        return ExchangeRateDTO::from_array([
            'provider_id' => static::ID,
            'base_currency' => $base_currency,
            'rates' => static::$rates,
            'timestamp' => time(),
        ]);
    }

    /**
     * @inheritDoc
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
