<?php

namespace Kirki\Ecommerce\App\Facades;

use Kirki\Ecommerce\App\Currency\CurrencyExchangeManager;
use Kirki\Ecommerce\Framework\Facade;

/**
 * @method static void set_base_currency(string $base_currency)
 * @method static array get_available_providers()
 * @method static \Kirki\Ecommerce\App\Currency\Contracts\CurrencyProvider|null get_active_provider()
 * @method static \Kirki\Ecommerce\App\Currency\DTO\ExchangeRateDTO get_rates(string $base_currency, array $symbols)
 * @method static void sync()
 *
 * @see \Kirki\Ecommerce\App\Currency\CurrencyExchangeManager
 */
class CurrencyExchange extends Facade
{
    /**
     * Get the registered name of the component.
     *
     * @return string
     */
    public static function get_accessor()
    {
        return CurrencyExchangeManager::class;
    }
}
