<?php

namespace Kirki\Ecommerce\App\Listeners;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Events\SettingsChangedEvent;
use Kirki\Ecommerce\App\Facades\CurrencyExchange;
use Kirki\Ecommerce\Framework\Listener;

/**
 * Listener for SettingsChangedEvent that starts or stops the automatic exchange rate sync schedule.
 *
 * @since 1.0.0
 */
class UpdateCurrencyRatesListener extends Listener
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
     * Start, replace or stop the automatic sync schedule after the currency settings are saved.
     *
     * A save that changes none of the schedule settings leaves the schedule as it is.
     *
     * @since 1.0.0
     *
     * @param SettingsChangedEvent $event The dispatched event.
     * @return void
     */
    public function handle(SettingsChangedEvent $event)
    {
        if ($event->key !== OptionKeys::CURRENCY_SETTINGS) {
            return;
        }

        if (!CurrencyExchange::is_automatic_update_active()) {
            CurrencyExchange::stop_schedule();
            return;
        }

        if (CurrencyExchange::is_schedule_outdated()) {
            CurrencyExchange::start_schedule();
        }
    }
}
