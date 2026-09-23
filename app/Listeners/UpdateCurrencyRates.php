<?php

namespace Kirki\Ecommerce\App\Listeners;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Events\SettingsChanged;
use Kirki\Ecommerce\App\Facades\CurrencyExchange;
use Kirki\Ecommerce\Framework\Listener;
use Kirki\Ecommerce\App\Supports\Facades\Settings;

/**
 * Listener for SettingsChanged that syncs exchange rates after the currency settings are saved.
 *
 * @since 1.0.0
 */
class UpdateCurrencyRates extends Listener
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function priority()
    {
        return 0;
    }

    /**
     * Sync exchange rates when the currency settings change with automatic updates enabled and a provider active.
     *
     * @since 1.0.0
     *
     * @param SettingsChanged $event The dispatched event.
     * @return void
     */
    public function handle(SettingsChanged $event)
    {
        if ($event->key !== OptionKeys::CURRENCY_SETTINGS) {
            return;
        }

        $is_automatic_update_enabled = Settings::get(OptionKeys::CURRENCY_SETTINGS)->get('is_automatic_update_enabled');

        if (!$is_automatic_update_enabled || CurrencyExchange::get_active_provider() === null) {
            return;
        }

        CurrencyExchange::sync();
    }
}
