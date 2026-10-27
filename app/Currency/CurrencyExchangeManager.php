<?php

namespace Kirki\Ecommerce\App\Currency;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Constants\UpdateFrequency;
use Kirki\Ecommerce\App\Currency\Contracts\CurrencyProvider;
use Kirki\Ecommerce\App\Currency\DTO\ExchangeRateDTO;
use Kirki\Ecommerce\App\DTO\Currency\UpdateCurrencyDTO;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\App\Jobs\SyncExchangeRatesJob;
use Kirki\Ecommerce\App\Services\CurrencyService;
use Kirki\Ecommerce\Framework\Supports\Facades\Date;
use Kirki\Ecommerce\App\Supports\Facades\Settings;

/**
 * Syncs stored currency exchange rates from the active rate provider.
 *
 * @since 1.0.0
 */
class CurrencyExchangeManager
{
    /**
     * @var CurrencyExchangeFactory
     */
    protected CurrencyExchangeFactory $factory;

    /**
     * @var CurrencyService
     */
    protected CurrencyService $service;

    /**
     * @var string
     */
    protected string $active_provider_id;

    /**
     * @var array<string, mixed>
     */
    protected array $config = [];

    /**
     * Create a new currency exchange manager instance.
     *
     * @since 1.0.0
     *
     * @param CurrencyExchangeFactory $factory
     * @param CurrencyService         $service
     * @param string                  $active_provider_id ID of the provider used for syncing, empty for none.
     * @param array<string, mixed>    $config             Settings passed to the active provider, such as the API key.
     */
    public function __construct(
        CurrencyExchangeFactory $factory,
        CurrencyService $service,
        string $active_provider_id = '',
        array $config = []
    ) {
        $this->factory = $factory;
        $this->service = $service;
        $this->active_provider_id = $active_provider_id;
        $this->config = $config;
    }

    /**
     * Get all registered currency providers.
     *
     * @since 1.0.0
     *
     * @return CurrencyProvider[]
     */
    public function get_available_providers()
    {
        return $this->factory->get_available_providers();
    }

    /**
     * Get the configured active currency provider.
     *
     * @since 1.0.0
     *
     * @return CurrencyProvider|null Null when no active provider ID is set.
     */
    public function get_active_provider()
    {
        return !empty($this->active_provider_id) ? $this->factory->make($this->active_provider_id, $this->config) : null;
    }

    /**
     * Get the exchange rates from the active provider.
     *
     * @since 1.0.0
     *
     * @param string   $base_currency Currency code the rates are relative to.
     * @param string[] $symbols       Currency codes to fetch rates for.
     * @return ExchangeRateDTO
     */
    public function get_rates(string $base_currency, array $symbols)
    {
        return $this->get_active_provider()->get_rates($base_currency, $symbols);
    }

    /**
     * Update stored currency exchange rates from the active provider.
     *
     * Updates only currencies whose rate changed, then records the provider
     * usage and the last sync time in the currency settings.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function sync()
    {
        $currencies = $this->service->all(ListFilterDTO::from_array([]));
        $codes = $currencies->pluck('code')->to_array();

        if (empty($codes)) {
            return;
        }

        $base_currency = $this->service->get_base_currency();

        $rates_dto = $this->get_rates($base_currency->code, $codes);
        $rates = $rates_dto->rates;

        foreach ($currencies as $currency) {
            $code = strtoupper($currency->code);

            if (!isset($rates[$code])) {
                continue;
            }

            $rate = $rates[$code];

            if ($currency->exchange_rate == $rate) {
                continue;
            }

            $update_dto = UpdateCurrencyDTO::from_array($currency->to_array());
            $update_dto->exchange_rate = $rate;

            $this->service->update($update_dto);
        }

        $usage = $this->get_active_provider()->get_usage();

        Settings::get(OptionKeys::CURRENCY_SETTINGS)->set([
            'usage' => is_null($usage->total) || is_null($usage->remaining) ? null : $usage->to_array(),
            'last_sync_at' => Date::now()->to_date_time_string(),
        ], false);
    }

    /**
     * Check whether automatic updates are on with a provider and an API key saved.
     *
     * Reads the stored settings, not the provider this manager was built with.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public function is_automatic_update_active()
    {
        $currency_settings = Settings::get(OptionKeys::CURRENCY_SETTINGS);

        return (bool) $currency_settings->get('is_automatic_update_enabled')
            && !empty($currency_settings->get('api_provider'))
            && !empty($this->get_active_provider_config()['api_key']);
    }

    /**
     * Start a new automatic sync schedule with an immediate sync.
     *
     * Any run queued by an earlier schedule does nothing once the token changes.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function start_schedule()
    {
        $token = $this->replace_schedule_token();

        SyncExchangeRatesJob::dispatch($token);
    }

    /**
     * Stop the automatic sync schedule.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function stop_schedule()
    {
        Settings::get(OptionKeys::CURRENCY_SETTINGS)->set([
            'sync_token' => null,
            'sync_fingerprint' => null,
            'next_sync_at' => null,
        ], false);
    }

    /**
     * Start a new automatic sync schedule whose first run is one interval from now.
     *
     * Used after an on-demand sync, which has just synced the rates.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function reschedule_after_sync()
    {
        $this->schedule_next($this->replace_schedule_token());
    }

    /**
     * Record the next run time and queue the next run of a schedule.
     *
     * Does nothing when the schedule has been replaced or stopped.
     *
     * @since 1.0.0
     *
     * @param string $token Token of the schedule to continue.
     * @return void
     */
    public function schedule_next(string $token)
    {
        $currency_settings = Settings::get(OptionKeys::CURRENCY_SETTINGS);

        if ($currency_settings->get('sync_token') !== $token) {
            return;
        }

        $interval = $this->get_sync_interval();

        $currency_settings->set(['next_sync_at' => Date::now()->add_seconds($interval)->to_date_time_string()], false);

        SyncExchangeRatesJob::dispatch($token)->delay($interval);
    }

    /**
     * Check whether a schedule token is the one currently stored.
     *
     * @since 1.0.0
     *
     * @param string $token
     * @return bool
     */
    public function is_current_schedule(string $token)
    {
        return Settings::get(OptionKeys::CURRENCY_SETTINGS)->get('sync_token') === $token;
    }

    /**
     * Check whether the stored schedule no longer matches the saved provider configuration.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public function is_schedule_outdated()
    {
        return Settings::get(OptionKeys::CURRENCY_SETTINGS)->get('sync_fingerprint') !== $this->get_schedule_fingerprint();
    }

    /**
     * Check whether the schedule has stopped running.
     *
     * A schedule has stopped when no next run is recorded, or the recorded run
     * is more than one interval in the past.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public function is_schedule_stalled()
    {
        $next_sync_at = Settings::get(OptionKeys::CURRENCY_SETTINGS)->get('next_sync_at');

        if (empty($next_sync_at)) {
            return true;
        }

        return Date::parse($next_sync_at)->get_timestamp() < Date::now()->get_timestamp() - $this->get_sync_interval();
    }

    /**
     * Record the error of a failed automatic sync.
     *
     * @since 1.0.0
     *
     * @param string $message
     * @return void
     */
    public function record_sync_error(string $message)
    {
        Settings::get(OptionKeys::CURRENCY_SETTINGS)->set([
            'last_sync_error' => $message,
            'last_sync_error_at' => Date::now()->to_date_time_string(),
        ], false);
    }

    /**
     * Clear the error of the last failed automatic sync.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function clear_sync_error()
    {
        Settings::get(OptionKeys::CURRENCY_SETTINGS)->set([
            'last_sync_error' => null,
            'last_sync_error_at' => null,
        ], false);
    }

    /**
     * Get the API configuration of the selected provider.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The normalized configuration, or an empty array when the selected provider has none.
     */
    public function get_active_provider_config()
    {
        $currency_settings = Settings::get(OptionKeys::CURRENCY_SETTINGS);
        $provider_id = (string) $currency_settings->get('api_provider');
        $configs = $this->normalize_provider_configs($currency_settings->get('api_configs'));

        return $configs[$provider_id] ?? [];
    }

    /**
     * Normalize a map of provider API configurations keyed by provider id.
     *
     * Entries that are not arrays are dropped.
     *
     * @since 1.0.0
     *
     * @param mixed $configs
     * @return array<string, array<string, mixed>>
     */
    public function normalize_provider_configs($configs)
    {
        $normalized = [];

        foreach ((array) $configs as $provider_id => $config) {
            if (is_array($config)) {
                $normalized[(string) $provider_id] = $this->normalize_provider_config($config);
            }
        }

        return $normalized;
    }

    /**
     * Keep only the known fields of a provider's API configuration.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $config
     * @return array<string, mixed>
     */
    public function normalize_provider_config(array $config)
    {
        return [
            'api_key' => $config['api_key'] ?? null,
            'update_frequency' => $config['update_frequency'] ?? null,
        ];
    }

    /**
     * Get the number of seconds between automatic syncs for the saved update frequency.
     *
     * Falls back to a 24 hour interval for unrecognised frequencies.
     *
     * @since 1.0.0
     *
     * @return int
     */
    public function get_sync_interval()
    {
        $frequency = $this->get_active_provider_config()['update_frequency'] ?? null;

        switch ($frequency) {
            case UpdateFrequency::EVERY_15_MIN:
                return 15 * MINUTE_IN_SECONDS;
            case UpdateFrequency::EVERY_30_MIN:
                return 30 * MINUTE_IN_SECONDS;
            case UpdateFrequency::EVERY_1_HOUR:
                return HOUR_IN_SECONDS;
            case UpdateFrequency::EVERY_6_HOURS:
                return 6 * HOUR_IN_SECONDS;
            case UpdateFrequency::EVERY_12_HOURS:
                return 12 * HOUR_IN_SECONDS;
            case UpdateFrequency::DAILY_24_HOURS:
            default:
                return DAY_IN_SECONDS;
        }
    }

    /**
     * Store a new schedule token and the fingerprint of the configuration it runs with.
     *
     * @since 1.0.0
     *
     * @return string The new token.
     */
    protected function replace_schedule_token()
    {
        $token = wp_generate_uuid4();

        Settings::get(OptionKeys::CURRENCY_SETTINGS)->set([
            'sync_token' => $token,
            'sync_fingerprint' => $this->get_schedule_fingerprint(),
        ], false);

        return $token;
    }

    /**
     * Get a hash of the settings that define the automatic sync schedule.
     *
     * @since 1.0.0
     *
     * @return string
     */
    protected function get_schedule_fingerprint()
    {
        $currency_settings = Settings::get(OptionKeys::CURRENCY_SETTINGS);
        $active_config = $this->get_active_provider_config();

        return md5((string) wp_json_encode([
            (bool) $currency_settings->get('is_automatic_update_enabled'),
            $currency_settings->get('api_provider'),
            $active_config['api_key'] ?? null,
            $active_config['update_frequency'] ?? null,
        ]));
    }
}
