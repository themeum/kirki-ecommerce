<?php

namespace Kirki\Ecommerce\App\Facades;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Currency\CurrencyExchangeManager;
use Kirki\Ecommerce\Framework\Facade;

/**
 * Facade for the currency exchange manager.
 *
 * @since 1.0.0
 *
 * @method static void set_base_currency(string $base_currency)
 * @method static array get_available_providers()
 * @method static \Kirki\Ecommerce\App\Currency\Contracts\CurrencyProvider|null get_active_provider()
 * @method static \Kirki\Ecommerce\App\Currency\DTO\ExchangeRateDTO get_rates(string $base_currency, array $symbols)
 * @method static void sync()
 * @method static bool is_automatic_update_active()
 * @method static void start_schedule()
 * @method static void stop_schedule()
 * @method static void reschedule_after_sync()
 * @method static void schedule_next(string $token)
 * @method static bool is_current_schedule(string $token)
 * @method static bool is_schedule_outdated()
 * @method static bool is_schedule_stalled()
 * @method static void record_sync_error(string $message)
 * @method static void clear_sync_error()
 * @method static int get_sync_interval()
 * @method static array get_active_provider_config()
 * @method static array normalize_provider_configs(mixed $configs)
 * @method static array normalize_provider_config(array $config)
 *
 * @see \Kirki\Ecommerce\App\Currency\CurrencyExchangeManager
 */
class CurrencyExchange extends Facade
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public static function get_accessor()
    {
        return CurrencyExchangeManager::class;
    }
}
