<?php

namespace Kirki\Ecommerce\App\Providers;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Currency\CurrencyExchangeFactory;
use Kirki\Ecommerce\App\Currency\CurrencyExchangeManager;
use Kirki\Ecommerce\App\Services\CurrencyService;
use Kirki\Ecommerce\Framework\ServiceProvider;

use Kirki\Ecommerce\Framework\Supports\Arr;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use function Kirki\Ecommerce\Framework\config;

/**
 * Registers the currency exchange factory and manager, configured from the currency settings.
 *
 * @since 1.0.0
 */
class CurrencyServiceProvider extends ServiceProvider
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function register()
    {
        $this->app->singleton(CurrencyExchangeFactory::class, function ($app) {
            $providers = Arr::map(config('currency.providers', []), fn($provider) => new $provider());
            $factory = new CurrencyExchangeFactory($providers);

            return $factory;
        });

        $this->app->singleton(CurrencyExchangeManager::class, function ($app) {
            $factory = $app->make(CurrencyExchangeFactory::class);
            $service = $app->make(CurrencyService::class);
            $settings = Settings::get(OptionKeys::CURRENCY_SETTINGS);

            $active_provider_id = $settings->get('api_provider') ?? '';
            $config = $settings->get('api_config') ?? [];

            return new CurrencyExchangeManager($factory, $service, $active_provider_id, $config);
        });
    }
}
