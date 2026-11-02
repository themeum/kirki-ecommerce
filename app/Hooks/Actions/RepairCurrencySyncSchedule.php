<?php

namespace Kirki\Ecommerce\App\Hooks\Actions;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Facades\CurrencyExchange;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;

use function Kirki\Ecommerce\Framework\with_prefix;

/**
 * Restarts the automatic exchange rate sync schedule when it has stopped running.
 *
 * @since 1.0.0
 */
class RepairCurrencySyncSchedule extends BaseHook
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_name(): string
    {
        return with_prefix('queue_sweep');
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_type(): string
    {
        return HookTypes::ACTION;
    }

    /**
     * Start a new schedule when automatic updates are on and no run is due soon.
     *
     * Responds to the queue's every-minute sweep action.
     *
     * @since 1.0.0
     *
     * @param mixed ...$args Hook arguments; unused.
     * @return void
     */
    public function handle(...$args)
    {
        if (!CurrencyExchange::is_automatic_update_active() || !CurrencyExchange::is_schedule_stalled()) {
            return;
        }

        CurrencyExchange::start_schedule();
    }
}
