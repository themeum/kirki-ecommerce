<?php

namespace Kirki\Ecommerce\App\Listeners;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Events\SettingsChanged;
use Kirki\Ecommerce\App\Facades\CurrencyExchange;
use Kirki\Ecommerce\Framework\Listener;
use Kirki\Ecommerce\App\Supports\Facades\Settings;

class UpdateCurrencyRates extends Listener
{
    public function priority()
    {
        return 0;
    }

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
