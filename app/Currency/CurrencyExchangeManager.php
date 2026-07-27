<?php

namespace Kirki\Ecommerce\App\Currency;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Constants\UpdateFrequency;
use Kirki\Ecommerce\App\Currency\Contracts\CurrencyProvider;
use Kirki\Ecommerce\App\Currency\DTO\ExchangeRateDTO;
use Kirki\Ecommerce\App\DTO\Currency\UpdateCurrencyDTO;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\App\Services\CurrencyService;
use Kirki\Ecommerce\Framework\Supports\Facades\Date;
use Kirki\Ecommerce\App\Supports\Facades\Settings;

class CurrencyExchangeManager
{
    protected CurrencyExchangeFactory $factory;
    protected CurrencyService $service;
    protected string $active_provider_id;
    protected array $config = [];

    /**
     * Create a new currency exchange manager instance.
     *
     * @param CurrencyExchangeFactory $factory
     * @param CurrencyService $service
     * @param string $active_provider_id
     * @param array $config
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
     * Get the available currency providers.
     *
     * @return array
     */
    public function get_available_providers()
    {
        return $this->factory->get_available_providers();
    }

    /**
     * Get the active currency provider.
     *
     * @return CurrencyProvider|null
     */
    public function get_active_provider()
    {
        return !empty($this->active_provider_id) ? $this->factory->make($this->active_provider_id, $this->config) : null;
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
        return $this->get_active_provider()->get_rates($base_currency, $symbols);
    }

    /**
     * Sync the exchange rates.
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

        $currency_settings = Settings::get(OptionKeys::CURRENCY_SETTINGS);
        $frequency = $currency_settings->get('api_config.update_frequency', 'hourly');

        $settings_array = $currency_settings->to_array();

        $usage = $this->get_active_provider()->get_usage();

        $settings_array['usage'] = is_null($usage->total) || is_null($usage->remaining) ? null : $usage->to_array();
        $settings_array['last_sync_at'] = Date::now()->to_date_time_string();
        $settings_array['next_sync_at'] = $this->get_next_sync_at($frequency);

        $currency_settings->set($settings_array, false);
    }

    /**
     * Get the next sync at time.
     *
     * @param string $frequency
     * @return string
     */
    protected function get_next_sync_at(string $frequency)
    {
        switch ($frequency) {
            case UpdateFrequency::EVERY_15_MIN:
                return Date::now()->add_minutes(15)->to_date_time_string();
            case UpdateFrequency::EVERY_30_MIN:
                return Date::now()->add_minutes(30)->to_date_time_string();
            case UpdateFrequency::EVERY_1_HOUR:
                return Date::now()->add_hour()->to_date_time_string();
            case UpdateFrequency::EVERY_6_HOURS:
                return Date::now()->add_hours(6)->to_date_time_string();
            case UpdateFrequency::EVERY_12_HOURS:
                return Date::now()->add_hours(12)->to_date_time_string();
            case UpdateFrequency::DAILY_24_HOURS:
            default:
                return Date::now()->add_day()->to_date_time_string();
        }
    }
}
